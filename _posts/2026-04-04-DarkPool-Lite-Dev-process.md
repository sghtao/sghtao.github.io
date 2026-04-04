---
title: "BuidlHack 2026 - DarkPool Lite 개발 과정"
date: 2026-04-04 00:00:00 +0900
categories: [BlueNode - Blockchain, Hackathon]
tags: [DarkPool,BuidlHack]
---

## GitHub에서 레포 생성
Repository name: darkpool-lite-ai-matching
Description: AI matching engine for DarkPool Lite — BuidlHack 2026
Public (해커톤이니까 공개)
Add a README file 체크
Add .gitignore → Python 선택
License는 MIT 선택하거나 비워둬도 됨

![github local setting](/assets/img/githublocalsetting.png)

## DarkPool Lite AI Matching 모듈의 프로젝트 구조

### 디렉토리 구조

```text
darkpool-lite-ai-matching/
├── price_feed/
│   ├── __init__.py
│   ├── pancakeswap.py        # PancakeSwap V3 Subgraph 가격 수집
│   ├── binance.py             # Binance REST API 가격 수집
│   └── aggregator.py          # 복수 소스 가중 평균 산출
├── matching/
│   ├── __init__.py
│   ├── types.py               # Order, MatchResult, MatchingResponse 데이터 클래스
│   ├── prompt.py              # 시스템 프롬프트 + 매칭 규칙 정의
│   ├── schema.py              # LLM 응답 JSON 스키마 / function calling 정의
│   ├── engine.py              # NEAR AI Cloud 호출 (OpenAI SDK)
│   └── validator.py           # 후검증 (체결가/수량/슬리피지 가드레일)
├── fallback/
│   ├── __init__.py
│   └── dex_router.py          # DEX 폴백 라우팅 (P2)
├── tests/
│   ├── __init__.py
│   ├── test_price_feed.py
│   ├── test_matching.py
│   └── test_validator.py
├── interface.py                # 현승 TEE 엔진이 호출하는 진입점
├── state.py                    # prev_fair_price 등 내부 상태 관리
└── requirements.txt
```

## 유저 플로우 정의 (기호 관점)

```text
[PancakeSwap Subgraph]──시세──┐
[Binance API]──────────시세──┤
                              ▼
                        가격 피드 모듈 (기호)
                              │ 공정가
                              ▼
[현승: TEE 엔진] ──주문 목록──▶ AI 매칭 모듈 (기호)
                              │
                     ┌──────────┤
                     ▼          ▼
              주문+시세+규칙을 조합
                     │
                     ▼
              NEAR AI Cloud (TEE 내부)
              LLM이 매칭 수행
                     │
                     ▼
              후검증 모듈 (기호)
                     │
              ┌──────┴──────┐
              ▼              ▼
         매칭 성공       매칭 실패
              │              │
              ▼              ▼
       매칭 결과 반환   DEX 폴백 (P2)
       (→ 현승: 서명 → 승재: 컨트랙트)
```

### 현승님과 정해야 할 사항
- 가격 피드 형식
- 알고리즘 호출 인터페이스
#### 질문과 답변
매칭 알고리즘 호출 인터페이스
현승님 TEE 엔진이 제 매칭 로직을 호출할 때, 아래 같은 형태를 생각하고 있습니다.

입력 (현승님 → 기호)
주문 리스트. 각 주문에 이 정도 필드가 있으면 충분합니다.
order_id: str (주문 고유 ID)
side: "buy" | "sell"
token_pair: str (예: "BNB/USDT")
amount: float (수량)
limit_price: float (매수: 최대 지불가, 매도: 최소 수취가)
timestamp: float (주문 접수 시각, unix)

추가로 넣어야 할 필드가 있으면 알려주세요.

출력 (기호 → 현승님)
matches: [{maker_order_id, taker_order_id, fill_amount, execution_price}]
remaining_orders: 미체결/부분체결 잔여 주문 리스트 (잔여 수량 포함)
fair_price: 이번 라운드에 사용한 기준 공정가
error: 에러 발생 시 메시지 (정상이면 null)

가격 피드 데이터 형식
저는 PancakeSwap V3 Subgraph + Binance API에서 실시간 시세를 수집해서 공정가를 산출할 건데요, 두 가지 방식이 가능합니다.

A) 제가 직접 가격을 수집해서 매칭할 때 내부적으로 사용
→ 현승님 쪽에서는 주문 리스트만 넘겨주시면 됩니다.

B) 현승님 쪽에서 가격 데이터를 수집해서 호출 시 함께 전달
→ 입력에 price_data 필드가 추가됩니다.

현승님 쪽 구조에서 어느 쪽이 자연스러운지 알려주시면 맞추겠습니다.

상태 관리 (사소한 건)
슬리피지 보호를 위해 직전 라운드의 공정가가 필요합니다.
A) 현승님이 매 호출 시 prev_fair_price를 파라미터로 넘겨주기
B) 제 모듈 내부에서 변수로 관리

현승님 쪽에서 관리하시는 게 편하면 A로, 아니면 B로 가겠습니다.

매칭 알고리즘 호출 인터페이스
입출력 구조 자체는 깔끔한데, 필드 하나만 추가하면 좋을 것 같습니다. 매칭 결과를 BSC 컨트랙트에 보낼 때, 누구의 자산을 누구에게 보낼지 주소가 있어야 하고 TEE 엔진에서 나중에 서명할 때, maker/taker의 지갑 주소를 매칭 결과에 포함시켜야 하니 주문 단계에서 받아둘 수 있도록 입력에 wallet_addr를 포함시켜주세요!

가격 피드 -> A안
TEE 엔진 입장에서 가격 피드 수집까지 책임지면 TEE 엔진 쪽 복잡도가 올라간다고 생각합니다.  TEE 엔진에서는 주문 수신 -> 저장 -> 매칭 호출 -> 서명 -> 컨트랙트 전달 파이프라인에 집중하는 게 낫고, 가격 로직은 AI 매칭 모듈 안에서 완결되는 게 경계가 깔끔할거 같아요. 
또한 어차피 TEE 안에서 AI 매칭 모듈이 돌아가니까 AI 매칭 모듈이 TEE 내부에서 직접 외부 API를 호출해도 프라이버시에 문제 없을거 같아요. TEE 밖으로 주문 정보가 나가는 게 아니라 시세를 가져오는 거라 방향이 반대니까요.
정리하면  제 쪽에서는 주문 리스트만 넘기면 되고, 기호님 모듈이 가격 수집 + 매칭을 한 번에 처리해서 결과를 리턴하는 구조가 될 것 같습니다.

상태 관리 -> B안
TEE 엔진은 매칭 로직의 내부 상태를 몰라야 한다고 생각합니다. TEE 엔진이 매번 prev_fair_price를 추적해서 넘기면 TEE 엔진이 매칭 로직에 의존성이 생기고, 나중에 슬리피지 기준이 바뀌면 양쪽 다 고쳐야 하니... 매칭 모듈을 블랙박스로 호출하는 구조가 깔끔할 것 같습니다. 기호님 쪽에서 내부 변수로 관리하면 매칭 로직 변경이 AI 매칭 모듈 안에서 완결될 것 같습니다.


## 유저플로우 정의

### 전체 유저 플로우에서 내 파트의 위치
앨리스(매도자)와 밥(매수자)이 DarkPool Lite를 사용하는 전체 흐름 중, 기호 코드가 작동하는 구간을 ★로 표시한다.
1. 앨리스가 프론트엔드(진성)에서 지갑을 연결한다.
2. 앨리스가 "BNB 100개를 개당 580 USDT 이상에 팔겠다"는 매도 주문을 제출한다.
3. 밥도 "BNB 60개를 개당 585 USDT 이하에 사겠다"는 매수 주문을 제출한다.
4. 프론트엔드가 암호화 채널을 통해 TEE 엔진(현승)으로 주문을 전송한다. 주문에는 wallet_addr가 포함된다.
5. 현승의 TEE 엔진이 주문을 수신·저장하고, 주문 리스트만 기호의 AI 매칭 모듈에 넘긴다.
6. ★ 기호의 가격 피드 모듈이 PancakeSwap V3 Subgraph + Binance API에서 BNB/USDT 실시간 시세를 수집하고, 가중 평균으로 기준 공정가(582.3 USDT)를 산출한다.
7. ★ 기호의 코드가 주문 데이터 + 시세 + 매칭 규칙을 조합하여 OpenAI SDK로 NEAR AI Cloud에 요청을 보낸다. 이 순간부터 데이터는 TEE 안으로 들어간다.
8. ★ NEAR AI Cloud의 LLM이 TEE 안에서 매칭을 수행한다. 주문 내용, 프롬프트, 결과 전부 암호학적으로 격리된 상태. 운영자도 열람 불가.
9. ★ LLM이 매칭 결과를 JSON으로 반환한다. (앨리스-밥 60개, 체결가 582.3 USDT)
10. ★ 기호의 후검증 모듈이 결과를 기계적으로 검증한다. 체결가가 양측 희망가 범위 안인지, 수량이 맞는지, 슬리피지 가드레일 통과하는지 확인. 동시에 이번 공정가를 내부 변수에 저장한다 (다음 라운드 슬리피지 비교용).
11. ★ 검증 통과한 매칭 결과(wallet_addr 포함) + 잔여 주문 + 공정가를 현승에게 반환한다.
12. 현승의 TEE 엔진이 attestation을 확보하고, 매칭 결과에 서명을 붙여 BSC 컨트랙트(승재)에 전달한다. maker/taker의 wallet_addr를 사용해 누구에게 어떤 자산을 보낼지 지정한다.
13. 앨리스와 밥이 각각 에스크로 컨트랙트에 자산 예치를 승인한다.
14. 승재의 컨트랙트가 서명을 검증한 후 아토믹 스왑을 실행한다.
15. 체인에는 최종 스왑 트랜잭션만 기록된다.

앨리스의 잔여 40개는 현승의 TEE 엔진에 대기 상태로 남고, 새 매수 주문이 들어오면 기호 모듈이 다시 호출된다.

### 나의 과정만 떼어 놓고 보자.
6. ★ 기호의 가격 피드 모듈이 PancakeSwap V3 Subgraph + Binance API에서 BNB/USDT 실시간 시세를 수집하고, 가중 평균으로 기준 공정가(582.3 USDT)를 산출한다.
7. ★ 기호의 코드가 주문 데이터 + 시세 + 매칭 규칙을 조합하여 OpenAI SDK로 NEAR AI Cloud에 요청을 보낸다. 이 순간부터 데이터는 TEE 안으로 들어간다.
8. ★ NEAR AI Cloud의 LLM이 TEE 안에서 매칭을 수행한다. 주문 내용, 프롬프트, 결과 전부 암호학적으로 격리된 상태. 운영자도 열람 불가.
9. ★ LLM이 매칭 결과를 JSON으로 반환한다. (앨리스-밥 60개, 체결가 582.3 USDT)
10. ★ 기호의 후검증 모듈이 결과를 기계적으로 검증한다. 체결가가 양측 희망가 범위 안인지, 수량이 맞는지, 슬리피지 가드레일 통과하는지 확인. 동시에 이번 공정가를 내부 변수에 저장한다 (다음 라운드 슬리피지 비교용).
11. ★ 검증 통과한 매칭 결과(wallet_addr 포함) + 잔여 주문 + 공정가를 현승에게 반환한다.

## 기호 모듈 내부 처리 흐름

### 1. 가격 피드 수집
PancakeSwap V3 Subgraph에 GraphQL 쿼리를 보내 토큰 페어의 최신 풀 가격을 가져온다. (타임아웃 3초)
Binance REST API에 요청을 보내 같은 토큰 페어의 현물 가격을 가져온다. (타임아웃 2초)
폴백: 한 소스 실패 시 나머지 하나로 진행. 둘 다 실패 시 에러 반환, 매칭 중단.
두 소스의 가격을 가중 평균하여 기준 공정가를 산출한다. (PancakeSwap 60%, Binance 40%)

### 2. NEAR AI Cloud 호출 구성
시스템 프롬프트를 구성한다. 매칭 규칙을 명시: 가격 호환성(매수 희망가 ≥ 매도 희망가), 공정가 기준 체결가 산출, 다자간 분할 매칭(체결량 최대화), JSON 포맷 강제.
유저 메시지로 주문 리스트(wallet_addr 포함)와 수집한 공정가를 JSON으로 전달한다.
function calling 또는 response_format으로 LLM 응답을 정해진 JSON 스키마로 강제한다.
OpenAI SDK로 NEAR AI Cloud에 요청을 보낸다.

### 3. 후검증
LLM은 확률적으로 동작하므로, 반환된 매칭 결과를 기계적으로 검증한다.

각 매칭의 체결가가 매수자의 limit_price를 초과하지 않는지 확인한다.
각 매칭의 체결가가 매도자의 limit_price 미만이 아닌지 확인한다.
체결 수량이 양측 잔여 수량을 초과하지 않는지 확인한다.
maker_order_id, taker_order_id가 실제 입력된 주문에 존재하는지 확인한다.
내부 변수에 저장된 prev_fair_price 대비 이번 공정가의 변동폭이 임계값(2%)을 초과하면 라운드를 보류한다.
이번 공정가를 prev_fair_price에 저장한다.
검증 실패한 매칭은 제거하고, 통과한 것만 최종 결과에 포함한다.

### 4. 결과 반환
최종 MatchResult 리스트(wallet_addr 포함) + 잔여 주문 리스트 + 공정가를 현승의 TEE 엔진에 반환한다.

## 모듈 내부 처리 흐름 구체화

### 1. 가격 피드 수집
**pancakeswap.py**
엔드포인트: [https://api.thegraph.com/subgraphs/name/pancakeswap/exchange-v3-bsc](https://api.thegraph.com/subgraphs/name/pancakeswap/exchange-v3-bsc)
GraphQL 쿼리:
```graphql
{
  pools(
    where: {
      token0: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"  # WBNB
      token1: "0x55d398326f99059fF775485246999027B3197955"  # BSC-USD (USDT)
    }
    orderBy: totalValueLockedUSD
    orderDirection: desc
    first: 1
  ) {
    token0Price
    token1Price
    totalValueLockedUSD
  }
}
```
파싱: token0Price = "WBNB 1개당 USDT 가격". 이 값을 float로 변환해서 반환.
토큰 주소 매핑: token_pair 문자열("BNB/USDT")을 받으면 내부 딕셔너리에서 컨트랙트 주소 쌍으로 변환한다. 해커톤 스코프에서는 BNB/USDT 하드코딩으로 시작, 확장 가능한 구조만 잡아둔다.
실패 처리: HTTP 상태 코드 != 200, JSON 파싱 에러, pools 배열 빈 경우 → None 반환. 예외는 삼키고 로그만 남긴다.
타임아웃: 3초. httpx.AsyncClient(timeout=3.0) 또는 동기 httpx.Client(timeout=3.0).
반환 타입: float | None

**binance.py**
엔드포인트: GET [https://api.binance.com/api/v3/ticker/price?symbol=BNBUSDT](https://api.binance.com/api/v3/ticker/price?symbol=BNBUSDT)
응답 예시: 
```json
{"symbol": "BNBUSDT", "price": "582.30"}
```
토큰 페어 매핑: "BNB/USDT" → "BNBUSDT" (슬래시 제거, 대문자 결합). 이것도 해커톤에서는 하드코딩 후 추후 매핑 함수로 확장.
파싱: float(response["price"])
실패 처리: pancakeswap.py와 동일 패턴. None 반환.
타임아웃: 2초.
반환 타입: float | None

**aggregator.py**
입력: pancakeswap 가격(float | None), binance 가격(float | None)
상수:
```python
PANCAKE_WEIGHT = 0.6
BINANCE_WEIGHT = 0.4
```
로직:
pancake  binance  →  결과
✅       ✅       →  (pancake × 0.6) + (binance × 0.4)
✅       ❌       →  pancake (단독)
❌       ✅       →  binance (단독)
❌       ❌       →  None (에러)
반환 타입: float | None
전체 호출 함수 (price_feed의 진입점):
```python
async def get_fair_price(token_pair: str) -> float | None:
    pancake = await fetch_pancakeswap(token_pair)
    binance = await fetch_binance(token_pair)
    return aggregate(pancake, binance)
```

### 2. NEAR AI Cloud 호출 구성
**prompt.py — 시스템 프롬프트**
You are an OTC matching engine. Given a list of buy/sell orders and a reference fair price,
match orders according to these rules:

1. PRICE COMPATIBILITY: A buy order matches a sell order only if buy.limit_price >= sell.limit_price.
2. EXECUTION PRICE: Use the provided fair_price as execution price.
   - If fair_price is between seller's and buyer's limit prices → use fair_price.
   - If fair_price falls outside both limits → use (buy.limit_price + sell.limit_price) / 2.
3. FILL AMOUNT: The fill quantity is min(buy.remaining, sell.remaining).
4. MULTI-PARTY MATCHING: When multiple orders exist, maximize total fill volume.
   Match the highest buy price with the lowest sell price first (greedy, sorted).
   If one side is partially filled, continue matching the remainder with the next order.
5. OUTPUT FORMAT: Return ONLY valid JSON matching the provided schema. No explanation.

매칭 규칙을 코드가 아닌 자연어로 명시하는 이유: LLM이 TEE 안에서 이 규칙을 "실행"하고, 기호의 후검증 코드가 TEE 밖에서 결과를 기계적으로 확인하는 이중 구조. LLM이 틀려도 후검증에서 걸린다.

**schema.py — 응답 JSON 스키마**
LLM이 이 포맷으로만 응답하도록 function calling 또는 response_format으로 강제한다.
```json
{
  "matches": [
    {
      "match_id": "m_001",
      "maker_order_id": "order_alice_1",
      "maker_wallet": "0xAlice...",
      "taker_order_id": "order_bob_1",
      "taker_wallet": "0xBob...",
      "token_pair": "BNB/USDT",
      "fill_amount": 60.0,
      "execution_price": 582.3
    }
  ],
  "remaining_orders": [
    {
      "order_id": "order_alice_1",
      "side": "sell",
      "token_pair": "BNB/USDT",
      "original_amount": 100.0,
      "remaining_amount": 40.0,
      "limit_price": 580.0,
      "wallet_addr": "0xAlice..."
    }
  ],
  "fair_price_used": 582.3
}
```

**engine.py — API 호출**
```python
from openai import OpenAI

NEAR_AI_BASE_URL = "https://api.near.ai/v1"  # 실제 엔드포인트 확인 필요
NEAR_AI_MODEL = "deepseek-ai/DeepSeek-V3.1"  # 또는 트랙에서 권장하는 모델

client = OpenAI(
    base_url=NEAR_AI_BASE_URL,
    api_key=NEAR_AI_API_KEY
)

def call_matching(system_prompt: str, user_message: str, schema: dict) -> dict:
    response = client.chat.completions.create(
        model=NEAR_AI_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ],
        response_format={"type": "json_schema", "json_schema": schema},
        temperature=0.0  # 결정적 응답을 위해 최소값
    )
    return json.loads(response.choices[0].message.content)
```

user_message 구성:
```json
{
  "orders": [
    {"order_id": "order_alice_1", "side": "sell", "token_pair": "BNB/USDT",
     "amount": 100.0, "limit_price": 580.0, "wallet_addr": "0xAlice...", "timestamp": 1712345678},
    {"order_id": "order_bob_1", "side": "buy", "token_pair": "BNB/USDT",
     "amount": 60.0, "limit_price": 585.0, "wallet_addr": "0xBob...", "timestamp": 1712345690}
  ],
  "fair_price": 582.3
}
```
temperature=0.0으로 설정하는 이유: 매칭은 규칙 기반이므로 창의적 응답이 필요 없다. 동일 입력에 동일 출력을 최대한 보장.
에러 처리: API 호출 실패, JSON 파싱 실패, 타임아웃 → MatchingResponse에 error 메시지를 담아 반환.

### 3. 후검증
**validator.py**
주문 ID로 원본 주문을 빠르게 찾기 위해, 검증 시작 전 `order_map = {o.order_id: o for o in orders}` 딕셔너리를 만든다.
검증 항목별 구체 로직:

검증 1: 매수자 보호
```python
  for match in matches:
      buyer = order_map[match.taker_order_id]
      if match.execution_price > buyer.limit_price:
          reject(match, reason="체결가가 매수 희망가 초과")
```

검증 2: 매도자 보호
```python
  for match in matches:
      seller = order_map[match.maker_order_id]
      if match.execution_price < seller.limit_price:
          reject(match, reason="체결가가 매도 희망가 미만")
```

검증 3: 수량 초과 방지
```python
  filled = {}  # order_id별 누적 체결량 추적
  for match in matches:
      filled[match.maker_order_id] = filled.get(match.maker_order_id, 0) + match.fill_amount
      filled[match.taker_order_id] = filled.get(match.taker_order_id, 0) + match.fill_amount
  for order_id, total_filled in filled.items():
      if total_filled > order_map[order_id].amount:
          reject_all_matches_for(order_id, reason="누적 체결량이 주문 수량 초과")
```

검증 4: 주문 존재 확인
```python
  for match in matches:
      if match.maker_order_id not in order_map:
          reject(match, reason="존재하지 않는 maker 주문")
      if match.taker_order_id not in order_map:
          reject(match, reason="존재하지 않는 taker 주문")
```

검증 5: 변동성 체크 (슬리피지 가드레일)
```python
  MAX_VOLATILITY = 0.02  # 2%
  if prev_fair_price is not None:
      change = abs(fair_price - prev_fair_price) / prev_fair_price
      if change > MAX_VOLATILITY:
          hold_entire_round(reason="공정가 변동폭 초과")
          return empty_result  # 이번 라운드 전체 보류
```

reject 처리: 개별 매칭을 리스트에서 제거. reject된 주문의 수량은 remaining_orders에 복원.

**state.py**
```python
class MatchingState:
    def __init__(self):
        self._prev_fair_price: float | None = None

    @property
    def prev_fair_price(self) -> float | None:
        return self._prev_fair_price

    def update_fair_price(self, new_price: float):
        self._prev_fair_price = new_price
```
모듈 레벨에서 싱글턴으로 유지. TEE 엔진이 프로세스를 재시작하면 초기화되는데, 첫 라운드에서는 prev_fair_price가 None이므로 변동성 체크를 스킵한다.

### 4. 결과 반환
**interface.py — 전체를 엮는 진입점**
```python
async def run_matching(orders: list[Order]) -> MatchingResponse:
    # 1. 가격 피드
    token_pair = orders[0].token_pair  # 현재는 단일 페어 가정
    fair_price = await get_fair_price(token_pair)
    if fair_price is None:
        return MatchingResponse(matches=[], remaining_orders=orders,
                                fair_price=0.0, error="price feed failed")

    # 2. NEAR AI Cloud 호출
    system_prompt = build_system_prompt()
    user_message = build_user_message(orders, fair_price)
    schema = get_response_schema()

    try:
        raw_result = call_matching(system_prompt, user_message, schema)
    except Exception as e:
        return MatchingResponse(matches=[], remaining_orders=orders,
                                fair_price=fair_price, error=f"LLM call failed: {e}")

    # 3. 후검증
    parsed_matches = parse_matches(raw_result)
    validated = validate_matches(parsed_matches, orders, fair_price, state.prev_fair_price)

    # 4. 상태 업데이트
    state.update_fair_price(fair_price)

    # 5. 잔여 주문 산출
    remaining = compute_remaining(orders, validated.accepted_matches)

    return MatchingResponse(
        matches=validated.accepted_matches,
        remaining_orders=remaining,
        fair_price=fair_price,
        error=None
    )
```

## 개발 액션 플랜
개발 액션 플랜 (Cursor 중심)
Phase 1: types.py (Day 1)
Cursor 프롬프트:
@docs/INTERFACE_SPEC.md 를 참고해서 matching/types.py를 작성해줘.

pydantic BaseModel 사용. 아래 모델들이 필요해:
- Order: order_id, side(Literal["buy","sell"]), token_pair, amount, limit_price, timestamp, wallet_addr
- MatchResult: match_id, maker_order_id, maker_wallet, taker_order_id, taker_wallet, token_pair, fill_amount, execution_price
- RemainingOrder: order_id, side, token_pair, original_amount, remaining_amount, limit_price, wallet_addr
- MatchingResponse: matches(list[MatchResult]), remaining_orders(list[RemainingOrder]), fair_price(float), error(str|None=None)

JSON 직렬화가 바로 되어야 하고, 각 모델에 사용 예시를 docstring으로 포함해줘.
state.py는 10줄이라 Cursor에서 직접 작성.
Git commit: feat: define data types and state management

Phase 2: price_feed 모듈 (Day 2)
2a. pancakeswap.py
Cursor 프롬프트:
@docs/ARCHITECTURE.md 의 3-1 가격 피드 수집 섹션을 참고해서 price_feed/pancakeswap.py를 작성해줘.

- httpx AsyncClient 사용, 타임아웃 3초
- PancakeSwap V3 Subgraph 엔드포인트: https://api.thegraph.com/subgraphs/name/pancakeswap/exchange-v3-bsc
- WBNB 주소: 0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c
- USDT 주소: 0x55d398326f99059fF775485246999027B3197955
- GraphQL로 totalValueLockedUSD 내림차순 첫 번째 풀의 token0Price 가져오기
- 실패 시 None 반환 (예외 삼키고 로그)
- 시그니처: async def fetch_pancakeswap_price(token_pair: str) -> float | None
터미널에서 바로 테스트:
pythonimport asyncio
from price_feed.pancakeswap import fetch_pancakeswap_price
print(asyncio.run(fetch_pancakeswap_price("BNB/USDT")))
2b. binance.py
Cursor 프롬프트:
@price_feed/pancakeswap.py 와 같은 패턴으로 price_feed/binance.py를 작성해줘.

- GET https://api.binance.com/api/v3/ticker/price?symbol=BNBUSDT
- token_pair "BNB/USDT" → "BNBUSDT"로 변환
- 타임아웃 2초
- 나머지 패턴은 pancakeswap.py와 동일
2c. aggregator.py
Cursor 프롬프트:
@price_feed/pancakeswap.py @price_feed/binance.py 를 조합하는 price_feed/aggregator.py를 작성해줘.

- 가중 평균: PancakeSwap 60%, Binance 40%
- 폴백: 한쪽 실패 시 나머지 단독, 둘 다 실패 시 None
- 시그니처: async def get_fair_price(token_pair: str) -> float | None
2d. 테스트
Cursor 프롬프트:
@price_feed/ 모듈 전체에 대한 tests/test_price_feed.py를 작성해줘.

테스트 케이스:
1. 양쪽 성공 → 가중 평균 검증 (구체적 수치로)
2. pancakeswap만 성공 → pancakeswap 단독
3. binance만 성공 → binance 단독
4. 둘 다 실패 → None
5. 실제 API 호출 (@pytest.mark.integration)

httpx 응답을 monkeypatch로 mock. pytest-asyncio 사용.
Cursor 터미널: pytest tests/test_price_feed.py -v
Git commit: feat: implement price feed module

Phase 3: prompt.py + schema.py (Day 3)
3a. prompt.py
Cursor 프롬프트:
@docs/MATCHING_RULES.md 를 참고해서 matching/prompt.py를 작성해줘.

두 가지를 만들어야 해:
1. SYSTEM_PROMPT 상수: LLM에게 매칭 규칙을 지시하는 시스템 프롬프트.
   규칙: 가격 호환성, 공정가 기준 체결가 산출, 다자간 분할 매칭(체결량 최대화), JSON만 반환.
2. build_user_message(orders: list[Order], fair_price: float) -> str 함수:
   주문 리스트 + 공정가를 JSON 문자열로 조합. @matching/types.py 의 Order 모델 사용.
이건 생성 후에 직접 프롬프트 문구를 다듬어. LLM이 규칙을 잘 따르는지는 나중에 실제 호출로 확인.
3b. schema.py
Cursor 프롬프트:
@docs/INTERFACE_SPEC.md @matching/types.py 를 참고해서 matching/schema.py를 작성해줘.

두 가지 방식을 모두 준비:
1. response_format용 JSON 스키마 (dict)
2. function calling용 tools 파라미터 (dict)

스키마 구조:
- matches: [{match_id, maker_order_id, maker_wallet, taker_order_id, taker_wallet, token_pair, fill_amount, execution_price}]
- remaining_orders: [{order_id, side, token_pair, original_amount, remaining_amount, limit_price, wallet_addr}]
- fair_price_used: float

engine.py에서 어느 방식을 쓸지 선택할 수 있게 함수로 분리해줘.
Git commit: feat: add matching prompt and response schema

Phase 4: engine.py (Day 4)
Cursor 프롬프트:
@Near AI openai compatibility @OpenAI API Python @matching/prompt.py @matching/schema.py @matching/types.py 를 참고해서 matching/engine.py를 작성해줘.

- openai 라이브러리 사용 (from openai import OpenAI)
- 환경변수에서 읽기: NEAR_AI_BASE_URL (기본값 확인 필요), NEAR_AI_API_KEY, NEAR_AI_MODEL
- temperature=0.0
- prompt.py의 SYSTEM_PROMPT와 build_user_message 사용
- schema.py의 response_format 스키마 사용
- 응답 JSON 파싱해서 dict 반환
- API 실패, 파싱 실패 시 에러 메시지 포함한 dict 반환
- 시그니처: def call_matching(orders: list[Order], fair_price: float) -> dict
.env 파일 생성 (Cursor 터미널에서):
bashecho "NEAR_AI_BASE_URL=https://api.near.ai/v1" >> .env
echo "NEAR_AI_API_KEY=your-key-here" >> .env
echo "NEAR_AI_MODEL=deepseek-ai/DeepSeek-V3.1" >> .env
echo ".env" >> .gitignore
실제 API 호출 테스트를 Cursor 터미널에서 돌려보면서 프롬프트 튜닝.
Git commit: feat: implement NEAR AI Cloud engine

Phase 5: validator.py (Day 5)
Cursor 프롬프트:
@docs/ARCHITECTURE.md 의 3-3 후검증 섹션과 @matching/types.py 를 참고해서 matching/validator.py를 작성해줘.

입력: raw_result(dict), orders(list[Order]), fair_price(float), prev_fair_price(float|None)

검증 순서:
1. maker_order_id, taker_order_id가 실제 주문에 존재하는지
2. 체결가 ≤ 매수자 limit_price
3. 체결가 ≥ 매도자 limit_price
4. order_id별 누적 체결량 ≤ 원래 주문 수량
5. prev_fair_price 대비 변동 > 2%면 전체 라운드 보류

검증 실패한 매칭은 제거, 통과한 것만 반환.
반환 타입: ValidatedResult(accepted: list[MatchResult], rejected: list[dict], round_held: bool)
rejected에는 {match, reason} 형태로 거부 사유.
테스트 — Cursor 프롬프트:
@matching/validator.py 에 대한 tests/test_validator.py를 작성해줘.

테스트 케이스:
1. 정상 매칭 → 전부 통과
2. 체결가 > 매수자 limit → 거부
3. 체결가 < 매도자 limit → 거부
4. 누적 체결량 > 주문 수량 → 거부
5. 존재하지 않는 order_id → 거부
6. 공정가 변동 3% → round_held=True
7. 공정가 변동 1.5% → 정상 통과
8. prev_fair_price None → 변동성 체크 스킵
Cursor 터미널: pytest tests/test_validator.py -v
Git commit: feat: implement post-validation

Phase 6: interface.py 통합 (Day 6)
Cursor 프롬프트:
@docs/ARCHITECTURE.md @matching/types.py @price_feed/aggregator.py @matching/engine.py @matching/validator.py @state.py 를 전부 참고해서 interface.py를 작성해줘.

현승님 TEE 엔진이 이 함수 하나만 호출한다:
async def run_matching(orders: list[Order]) -> MatchingResponse

내부 흐름:
1. orders[0].token_pair로 토큰 페어 추출
2. get_fair_price() → 실패 시 에러 MatchingResponse
3. call_matching() → 실패 시 에러 MatchingResponse
4. validate_matches() → round_held면 에러 MatchingResponse
5. matching_state.update_fair_price()
6. 잔여 주문 산출
7. MatchingResponse 반환
통합 테스트 — Cursor 프롬프트:
@interface.py 에 대한 tests/test_matching.py를 통합 테스트로 작성해줘.

시나리오:
1. 앨리스 매도 100 BNB @ 580, 밥 매수 60 BNB @ 585 → 60개 매칭
2. 매도 100, 매수 60, 매수 50 → 다자간 분할
3. 매수가 < 매도가 → 빈 결과
4. 주문 0건 → 에러
5. 가격 피드 실패 → 에러

NEAR AI Cloud 호출은 mock 처리. mock 반환 JSON은 schema.py 포맷 준수.
Cursor 터미널: pytest tests/ -v 전체 실행.
Git commit: feat: integrate all modules in interface.py

Phase 7: 현승님 연동 (Day 7~8)
이 단계부터는 프롬프트가 아니라 Cursor에서 직접 디버깅이 핵심.
Cursor에서 할 일:

현승님 TEE 엔진에서 run_matching() 실제 호출 테스트
NEAR AI Cloud 실제 호출 → 프롬프트 튜닝 (LLM이 규칙을 안 따르면 prompt.py 수정)
응답 포맷이 schema.py와 안 맞으면 schema.py 수정
wallet_addr가 MatchResult까지 잘 전달되는지 확인

Claude Code (보조):

연동 중 반복 패턴의 버그가 발견되면 리팩토링
테스트 케이스 추가


Phase 8: 데모 안정화 (Day 9~10)
Cursor에서 할 일:

풀플로우 반복 테스트 (앨리스/밥 시나리오)
에러 메시지 정리
대윤 데모 영상 지원

Claude Code (보조):

README.md 작성 (설치법, 환경변수, 실행법, 아키텍처)
코드 정리



미팅 공유용
NEAR AI Cloud가 뭔데?
NEAR AI Cloud는 NEAR 블록체인이 운영하는 AI 추론 플랫폼이야. 핵심 특징이 하나 있는데, 모든 AI 추론이 TEE(신뢰 실행 환경) 안에서 돌아간다는 거야.
일반적인 AI API(ChatGPT, Claude API 등)는 내가 보낸 프롬프트를 서버 운영자가 기술적으로 볼 수 있어. "안 본다"고 약속할 뿐이지, 구조적으로 못 보는 건 아니야.
NEAR AI Cloud는 다르다. 내가 보낸 프롬프트와 데이터가 하드웨어 레벨에서 격리된 TEE 안으로 들어가고, 이 안에서 AI 모델이 추론을 수행해. TEE 안의 데이터는 NEAR AI Cloud 운영자조차 열람이 불가능하고, "이 결과가 진짜 TEE 안에서 나온 거다"라는 암호학적 증명(attestation)까지 제공돼.
사용 방식은 간단해. OpenAI SDK를 그대로 쓰되, base_url만 NEAR AI Cloud로 바꾸면 끝이야. 코드 한 줄 차이로 "신뢰 기반 AI"에서 "검증 가능한 프라이빗 AI"로 전환되는 거지.

왜 NEAR AI를 써야 하는가
기술적 이유: TEE 없이는 다크풀이 안 된다
우리 프로토콜의 핵심 모순을 다시 짚어보면:

"탈중앙화하면 정보가 공개되고, 정보를 숨기면 중앙화된 신뢰가 필요하다."

매칭 로직을 어디서 실행하느냐에 따라 세 가지 선택지가 있어:
선택지 1: 온체인 스마트 컨트랙트에서 매칭
→ 코드와 입력이 전부 공개됨. 주문 내용이 체인에 올라가는 순간 프론트러닝 당함. 다크풀의 의미가 사라짐.
선택지 2: 일반 서버에서 매칭
→ 주문을 숨길 수는 있지만, 서버 운영자가 주문 전부를 볼 수 있음. "운영자를 믿어라"가 됨. 중앙화 OTC 데스크와 다를 게 없음.
선택지 3: TEE 안에서 매칭
→ 주문이 TEE 안으로 들어가면 운영자도 못 보고, 결과만 암호학적 증명과 함께 나옴. 탈중앙화와 프라이버시를 동시에 달성. 이게 DarkPool Lite.
ZKP(영지식 증명)로도 이론적으로 가능하지만, 다자간 실시간 매칭에 ZKP를 적용하면 증명 생성에 수십 초~수 분이 걸려서 OTC에 비현실적이야. TEE는 밀리초 단위로 처리 가능.
대회적 이유: Near AI 트랙 심사 기준에 정확히 맞는다
Near AI 트랙 심사 기준을 보면:
기준배점우리 프로젝트가 맞는 이유Innovation30%"매칭 엔진을 TEE 안의 LLM으로 돌린다"는 구조 자체가 새로움Impact25%고래들의 MEV 피해는 실제 문제. 프라이빗 AI 없이는 해결 불가Technical Excellence20%OpenAI SDK + attestation 검증Privacy Design15%주문 의향이 TEE 밖으로 절대 나가지 않는 설계
트랙 설명에서 예시로 든 유스케이스 중 하나가 이거야:

"Collaborative AI, where multiple parties contribute data without revealing it to each other"

여러 트레이더가 주문 데이터를 기여하되, 서로 내용을 못 보는 구조. 이게 정확히 우리 프로젝트.
그러면 LLM이 아니라 TEE 안에서 규칙 기반 코드를 돌리면 안 되나?
기술적으로는 가능해. Phala Cloud의 Shade Agent처럼 커스텀 코드를 TEE에 배포하는 방법도 있어. 근데 두 가지 이유로 LLM을 쓰는 게 낫다:
첫째, 트랙이 "AI" 트랙이다. NEAR AI Cloud의 핵심 제품이 TEE 기반 AI 추론이고, 심사에서 이걸 활용하는 걸 기대하고 있어. if문 코드를 TEE에 넣는 것보다 LLM이 TEE 안에서 매칭하는 게 Innovation 30%에서 훨씬 유리해.
둘째, 후검증으로 안전성을 확보할 수 있다. "LLM이 확률적이라 매칭을 잘못하면 어쩌냐"는 걱정이 당연한데, 그래서 내가 후검증 모듈을 만드는 거야. LLM이 틀려도 후검증에서 기계적으로 걸러내니까 최종 결과는 항상 규칙을 만족해. LLM은 매칭을 "제안"하고, 코드가 "승인"하는 이중 구조.


AI 매칭인데, 무엇을 매칭하는가?
매수 주문과 매도 주문을 매칭한다. 앨리스가 "BNB 100개를 580 USDT 이상에 팔겠다"고 하고, 밥이 "BNB 60개를 585 USDT 이하에 사겠다"고 하면, 이 두 주문을 짝지어서 체결시키는 게 내 모듈이 하는 일이다.
현승님 TEE 엔진이 주문 리스트를 넘기면, 내 모듈이 매칭 결과를 만들어서 돌려주는 구조. 현승님한테는 블랙박스야. run_matching(orders) 하나만 호출하면 된다.
이게 구체적으로 뭘 하는 건가?
단순히 "매수가 ≥ 매도가면 체결"하는 게 아니라, 세 가지를 한다.
첫째, 최적 실행가 산출. PancakeSwap과 Binance에서 실시간 시세를 가져와서 가중 평균으로 공정가를 계산한다. 예를 들어 PancakeSwap에서 BNB가 581 USDT, Binance에서 583 USDT면, 가중 평균으로 582.3 USDT가 공정가가 된다. 앨리스 매도 희망가(580) ≤ 공정가(582.3) ≤ 밥 매수 희망가(585)이므로, 양쪽 다 손해 안 보는 582.3 USDT에 체결한다.
둘째, 다자간 분할 매칭. 주문이 3개 이상이면 체결량을 최대화하는 조합을 찾는다. 매도 A가 100개, 매수 B가 60개, 매수 C가 50개라면, A-B 60개를 먼저 매칭하고 A의 잔여 40개를 C와 매칭한다. C의 나머지 10개는 대기.
셋째, 슬리피지 보호. 시장이 급변해서 공정가가 직전 라운드 대비 2% 이상 튀면, 그 라운드 매칭을 보류한다. 유저 희망가에서 크게 벗어나는 체결을 막는 가드레일이다.
AI라는 건 어떤 모델을 뜻하는가?
NEAR AI Cloud에서 제공하는 LLM을 쓴다. NEAR AI Cloud는 OpenAI SDK 호환 추론 API인데, 핵심은 모든 추론이 TEE 안에서 실행된다는 거다.
내가 주문 데이터 + 시세 + 매칭 규칙을 OpenAI SDK로 NEAR AI Cloud에 보내면, LLM이 TEE 안에서 매칭을 수행하고 결과를 JSON으로 반환한다. 프롬프트, 주문 내용, 결과 전부 TEE 안에서 암호학적으로 격리되어서 운영자도 못 본다.
그런데 LLM은 확률적으로 동작하니까 잘못된 매칭을 할 수도 있다. 그래서 후검증 모듈을 둔다. LLM이 반환한 결과를 내 코드가 기계적으로 검증해서, 체결가가 희망가 범위를 벗어나거나 수량이 맞지 않으면 거부한다. LLM이 매칭을 "제안"하고, 코드가 "승인"하는 이중 구조.
정리하면 내 파트의 코드 실행 순서는 이렇다:

PancakeSwap + Binance에서 시세 수집 → 공정가 산출
주문 + 시세 + 매칭 규칙을 NEAR AI Cloud LLM에 전송 (TEE 진입)
LLM이 TEE 안에서 매칭 수행, 결과 JSON 반환
후검증으로 결과 검증
현승님에게 매칭 결과 반환

진행상황
현승님과 인터페이스 합의 완료. 입력은 주문 리스트(wallet_addr 포함), 출력은 매칭 결과 + 잔여 주문 + 공정가. 가격 피드는 내가 직접 수집하고, 상태 관리도 내 모듈 내부에서 한다.
프로젝트 폴더 구조 세팅 완료. 모듈 내부 처리 흐름 구체화 완료. 개발 액션 플랜 8단계로 작성 완료.
오늘 미팅 끝나면 types.py(데이터 모델)부터 코드 작성 시작한다.