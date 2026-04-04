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
4/18 파이널 피치 역산. 총 8단계, 각 단계별 Claude Code / Cursor 역할 구분.

### Phase 0: 프로젝트 재세팅 (Day 1 전반)
기존 폴더 구조를 새 구조로 교체.
Claude Code:
기존 폴더 구조를 삭제하고 아래 새 구조로 재생성해줘. 기존 README, .gitignore는 유지.

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
│   └── validator.py           # 후검증
├── fallback/
│   ├── __init__.py
│   └── dex_router.py          # DEX 폴백 라우팅 (P2)
├── tests/
│   ├── __init__.py
│   ├── test_price_feed.py
│   ├── test_matching.py
│   └── test_validator.py
├── interface.py                # 현승 TEE 엔진이 호출하는 진입점
├── state.py                    # prev_fair_price 내부 상태 관리
└── requirements.txt
```

각 .py에는 역할 독스트링만 넣어줘.
__init__.py는 비워둬.
requirements.txt에는:
```text
httpx>=0.27,<1.0    # PancakeSwap Subgraph + Binance API 호출
openai>=1.30,<2.0   # NEAR AI Cloud 호출 (OpenAI SDK 호환)
pydantic>=2.7,<3.0  # 데이터 모델 검증
pytest>=8.0,<9.0    # 테스트
pytest-asyncio>=0.23,<1.0  # 비동기 테스트
```

Cursor: Claude Code 실행 후 파일 트리 확인, git commit.
```bash
git add .
git commit -m "refactor: restructure for NEAR AI Cloud API architecture"
git push
```

### Phase 1: types.py (Day 1 후반)
모든 모듈이 참조하는 데이터 타입 확정. wallet_addr 포함.
Claude Code:
matching/types.py를 작성해줘. 현승님과 합의된 인터페이스 기반.

요구사항:
- dataclass 또는 pydantic BaseModel 사용 (pydantic 권장 — JSON 직렬화 + 검증 내장)
- Order: order_id(str), side(Literal["buy","sell"]), token_pair(str), amount(float),
  limit_price(float), timestamp(float), wallet_addr(str)
- MatchResult: match_id(str), maker_order_id(str), maker_wallet(str),
  taker_order_id(str), taker_wallet(str), token_pair(str), fill_amount(float),
  execution_price(float)
- MatchingResponse: matches(list[MatchResult]), remaining_orders(list[RemainingOrder]),
  fair_price(float), error(str|None)
- RemainingOrder: order_id(str), side(str), token_pair(str), original_amount(float),
  remaining_amount(float), limit_price(float), wallet_addr(str)
- 각 모델에 model_config로 JSON 직렬화 예시를 docstring에 포함해줘

Cursor: 생성된 types.py 리뷰, import 경로 확인, git commit.

### Phase 2: state.py (Day 1 후반)
간단하지만 먼저 만들어야 validator에서 참조 가능.
Cursor에서 직접 작성 (10줄 미만이라 Claude Code 불필요):
```python
"""prev_fair_price 등 매칭 모듈 내부 상태 관리"""

class MatchingState:
    def __init__(self):
        self._prev_fair_price: float | None = None

    @property
    def prev_fair_price(self) -> float | None:
        return self._prev_fair_price

    def update_fair_price(self, new_price: float):
        self._prev_fair_price = new_price

# 모듈 레벨 싱글턴
matching_state = MatchingState()
```
Git commit.

### Phase 3: price_feed 모듈 (Day 2)
3a. pancakeswap.py
Claude Code:
price_feed/pancakeswap.py를 작성해줘.

요구사항:
- httpx 사용 (동기 또는 비동기 — async 선호)
- 엔드포인트: [https://api.thegraph.com/subgraphs/name/pancakeswap/exchange-v3-bsc](https://api.thegraph.com/subgraphs/name/pancakeswap/exchange-v3-bsc)
- GraphQL 쿼리로 WBNB/USDT 풀의 token0Price를 가져온다
- WBNB 주소: 0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c
- USDT 주소: 0x55d398326f99059fF775485246999027B3197955
- totalValueLockedUSD 내림차순으로 가장 큰 풀 1개만 가져온다
- 타임아웃 3초
- 실패 시 None 반환 (예외 삼키고 로그)
- 함수 시그니처: async def fetch_pancakeswap_price(token_pair: str) -> float | None
- 해커톤이라 BNB/USDT 하드코딩 OK, 나중에 토큰 주소 매핑 딕셔너리로 확장 가능한 구조

Cursor: 생성된 코드에서 실제 API 호출 테스트. 터미널에서 빠르게 확인:
```python
import asyncio
from price_feed.pancakeswap import fetch_pancakeswap_price
print(asyncio.run(fetch_pancakeswap_price("BNB/USDT")))
```

3b. binance.py
Claude Code:
price_feed/binance.py를 작성해줘.

요구사항:
- httpx 사용 (async)
- 엔드포인트: GET [https://api.binance.com/api/v3/ticker/price?symbol=BNBUSDT](https://api.binance.com/api/v3/ticker/price?symbol=BNBUSDT)
- token_pair "BNB/USDT" → "BNBUSDT"로 변환
- 타임아웃 2초
- 실패 시 None 반환
- 함수 시그니처: async def fetch_binance_price(token_pair: str) -> float | None

Cursor: 동일하게 실제 호출 테스트.

3c. aggregator.py
Cursor에서 직접 작성 (로직 단순):
```python
PANCAKE_WEIGHT = 0.6
BINANCE_WEIGHT = 0.4

async def get_fair_price(token_pair: str) -> float | None:
    pancake = await fetch_pancakeswap_price(token_pair)
    binance = await fetch_binance_price(token_pair)

    if pancake and binance:
        return (pancake * PANCAKE_WEIGHT) + (binance * BINANCE_WEIGHT)
    elif pancake:
        return pancake
    elif binance:
        return binance
    return None
```

3d. price_feed 테스트
Claude Code:
tests/test_price_feed.py를 작성해줘.

테스트 케이스:
1. pancakeswap 성공 + binance 성공 → 가중 평균 검증
2. pancakeswap 성공 + binance 실패 → pancakeswap 단독
3. pancakeswap 실패 + binance 성공 → binance 단독
4. 둘 다 실패 → None
5. 실제 API 호출 통합 테스트 (마커: @pytest.mark.integration)

httpx 응답을 monkeypatch/mock으로 제어해서 유닛 테스트 작성.
pytest-asyncio 사용.

Cursor: pytest tests/test_price_feed.py 실행, 실패 케이스 디버깅.
Git commit: feat: implement price feed module with PancakeSwap + Binance

### Phase 4: matching 모듈 — 프롬프트 + 스키마 (Day 3)
4a. prompt.py
Cursor에서 직접 작성. 위에서 구체화한 시스템 프롬프트를 문자열 상수로 정의. 이건 Claude Code보다 직접 문장을 다듬는 게 낫다.
```python
SYSTEM_PROMPT = """You are an OTC matching engine..."""

def build_user_message(orders: list[Order], fair_price: float) -> str:
    """주문 리스트 + 공정가를 JSON 문자열로 조합"""
    ...
```

4b. schema.py
Claude Code:
matching/schema.py를 작성해줘.

요구사항:
- OpenAI API의 response_format에 넘길 JSON 스키마를 정의한다
- 스키마는 위 구체화 문서의 응답 JSON 구조와 일치해야 한다
  (matches 배열, remaining_orders 배열, fair_price_used)
- function calling 방식으로도 전환 가능하도록 tools 파라미터용 함수 정의도 같이 만들어줘
- 둘 다 만들고, engine.py에서 선택할 수 있게 해줘

Cursor: 스키마 리뷰. 필드 누락 확인.
Git commit: feat: add matching prompt and response schema

### Phase 5: matching 모듈 — 엔진 + 후검증 (Day 4~5)
5a. engine.py
Claude Code:
matching/engine.py를 작성해줘.

요구사항:
- openai 라이브러리 사용 (from openai import OpenAI)
- base_url은 환경변수 NEAR_AI_BASE_URL에서 읽기 (기본값: [https://api.near.ai/v1](https://api.near.ai/v1))
- api_key도 환경변수 NEAR_AI_API_KEY에서 읽기
- 모델명도 환경변수 NEAR_AI_MODEL에서 읽기 (기본값: deepseek-ai/DeepSeek-V3.1)
- temperature=0.0
- prompt.py의 SYSTEM_PROMPT와 build_user_message 사용
- schema.py의 response_format 스키마 사용
- 응답을 JSON 파싱해서 dict로 반환
- API 호출 실패, 파싱 실패 시 예외를 잡아서 에러 메시지 포함한 dict 반환
- 함수 시그니처: def call_matching(orders: list[Order], fair_price: float) -> dict

Cursor: NEAR AI Cloud API 키 세팅, 실제 호출 테스트. .env 파일 생성 + .gitignore에 .env 추가.

5b. validator.py
Claude Code:
matching/validator.py를 작성해줘.

요구사항:
- LLM이 반환한 매칭 결과(dict)를 기계적으로 검증하는 모듈
- 입력: raw_result(dict), orders(list[Order]), fair_price(float), prev_fair_price(float|None)
- 검증 항목 (순서대로):
  1. maker_order_id, taker_order_id가 실제 주문에 존재하는지
  2. 체결가가 매수자 limit_price 이하인지
  3. 체결가가 매도자 limit_price 이상인지
  4. order_id별 누적 체결량이 원래 주문 수량을 초과하지 않는지
  5. prev_fair_price 대비 변동폭이 2% 초과하면 전체 라운드 보류
- 검증 실패한 매칭은 제거, 통과한 것만 반환
- 반환: ValidatedResult(accepted: list[MatchResult], rejected: list[dict], round_held: bool)
- rejected에는 {match, reason} 형태로 거부 사유 기록

Cursor: 엣지케이스 직접 테스트.

5c. validator 테스트
Claude Code:
tests/test_validator.py를 작성해줘.

테스트 케이스:
1. 정상 매칭 → 전부 통과
2. 체결가가 매수자 limit 초과 → 해당 매칭 거부
3. 체결가가 매도자 limit 미만 → 해당 매칭 거부
4. 누적 체결량이 주문 수량 초과 → 해당 주문 관련 매칭 전부 거부
5. 존재하지 않는 order_id → 해당 매칭 거부
6. 공정가 변동 3% → 라운드 전체 보류 (round_held=True)
7. 공정가 변동 1.5% → 정상 통과
8. prev_fair_price가 None → 변동성 체크 스킵

Cursor: pytest tests/test_validator.py 실행.
Git commit: feat: implement NEAR AI engine + post-validation

### Phase 6: interface.py 통합 (Day 6)
Claude Code:
interface.py를 작성해줘. 모든 모듈을 엮는 진입점.

요구사항:
- 함수 시그니처: async def run_matching(orders: list[Order]) -> MatchingResponse
- 현승님 TEE 엔진이 이 함수만 호출하면 된다
- 내부 흐름:
  1. orders에서 token_pair 추출
  2. get_fair_price() 호출 → 실패 시 에러 반환
  3. call_matching() 호출 → 실패 시 에러 반환
  4. validate_matches() 호출
  5. state.update_fair_price()
  6. 잔여 주문 산출 (원래 수량 - 누적 체결량)
  7. MatchingResponse 반환
- state.py의 matching_state 싱글턴 사용
- 각 단계에서 에러 발생 시 적절한 MatchingResponse 반환 (error 필드에 메시지)

Cursor: 모든 import 경로 확인, 통합 테스트 실행.

통합 테스트
Claude Code:
tests/test_matching.py를 통합 테스트로 작성해줘.

테스트 시나리오:
1. 앨리스 매도 100 BNB @ 580, 밥 매수 60 BNB @ 585 → 60개 매칭, 잔여 40
2. 주문 3개: 매도 100, 매수 60, 매수 50 → 다자간 분할 매칭
3. 매수가 < 매도가 → 매칭 불가, 빈 결과
4. 주문 0건 → 에러 반환
5. 가격 피드 실패 → 에러 반환

NEAR AI Cloud 호출은 mock으로 처리.
mock이 반환하는 JSON은 schema.py 포맷과 일치하도록.

Cursor: pytest tests/ 전체 실행, 커버리지 확인.
Git commit: feat: integrate all modules in interface.py

### Phase 7: 현승님 연동 테스트 (Day 7~8)
Cursor (메인):
현승님 TEE 엔진에서 run_matching() 실제 호출
NEAR AI Cloud API 키 세팅 + 실제 LLM 호출 테스트
응답 포맷이 스키마와 맞는지 확인
프롬프트 튜닝: LLM이 규칙을 잘 따르는지, 엣지케이스에서 어떻게 응답하는지

Claude Code:
연동 중 발견된 버그 리팩토링
프롬프트 변경 시 테스트 케이스 업데이트

Git commit: fix: integration adjustments with TEE engine

### Phase 8: 데모 안정화 + 발표 준비 (Day 9~10)
Cursor:
앨리스/밥 시나리오 풀플로우 반복 테스트
에러 메시지 정리 (데모 중 에러 나도 깔끔하게 보이도록)
대윤 데모 영상 촬영 지원

Claude Code:
README 작성 (설치법, 환경변수, 실행법, 아키텍처 다이어그램)
코드 정리 + 불필요한 주석 제거

Git commit: docs: add README + cleanup for demo