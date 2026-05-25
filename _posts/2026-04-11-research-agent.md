---
title: Sentient의 ROMA + ODS로 블록체인 리서치 에이전트 구축하기
date: '2026-04-11 00:00:00 +0900'
categories:
  - Blockchain
  - AI Agent
tags:
  - sentient
  - roma
  - ods
  - ai-agent
  - blockchain
  - llm
  - defi
description: Sentient의 ROMA 프레임워크와 OpenDeepSearch를 활용한 블록체인 리서치 에이전트 아키텍처 설계 및 세팅 가이드
---
![](/assets/img/posts/image-motusko2.png)


![](/assets/img/posts/image-motuszef.png)

![](/assets/img/posts/image-motut7e4.png)

$2.2 ~ $2.5 22분 정도 돌았고, 가격이 이정도면 꽤 비싼 것 같은데, 주장형 에이전트로 만들면서, 비용까지 고려해야겠다.

![](/assets/img/posts/image-mou7l9n7.png)


gemini 3.1 pro를 mimov2.5 pro로 변경
gemini랑 거의 성능이 동급인데, 가격이 절반인데다, 저 세 모델을 대상으로 같은 질문을 날렸는데, 클로드랑 퍼플렉시티 모두 mimo의 답변을 가장 좋게 평가했다.

중국에서 만들어진 모델이라 처음부터 아예 고려하지 않았는데, 성능 표를 보면 고르지 않을 수 없는 스펙이다.

커서로 개발 중이고, codex와 opus가 확실히 잘한다.

mimo로 바꿔서 같은 프롬프트를 돌렸다. 그리고 이전에 돌렸을 때는 tool들이 제대로 연결되어있지 않아서 실행시간도 짧고 답변 퀄리티도 좋지 않았는데, 툴들을 다 연결하고 나니 68분 정도 돌았고 퀄리티가 확 올라갔다.

![](/assets/img/posts/image-mouaiodk.png)

![](/assets/img/posts/image-mouaiyfx.png)

![](/assets/img/posts/image-mouaj8xq.png)

![](/assets/img/posts/image-mouaoavy.png)

![](/assets/img/posts/image-mouape8v.png)

비용 3.85달러

아직 주장형 리서치 에이전트로 만들기 전이지만, 그렇게 더 튜닝하면 비용이 어떻게 되려나
mimo가 비용을 많이 낮춘 것 같다. gemini pro였으면 미모의 2배 비용이었겠네. 근데 생각보다 gpt 5.4 mini가 비용을 많이 먹는데 모델을 바꾸거나 비용을 줄일 수 있는 방법을 고민해봐야겠다. 

이 자리를 바꾸면 비용을 더 줄일 수 있겠다.
플래너를 mimo v2.5 pro로, 웹서치툴킷을 deepseek v4 flash로 변경했다.

완료된 것:

GPT-5.4 Mini 제거 -> Planner LLM을 xiaomi/mimo-v2.5-pro, WebSearchToolkit 4곳을 deepseek/deepseek-v4-flash로 교체
예상 비용 절감: $1.80 -> ~$0.23 (87%)
내일 해결할 것:

Arkham, Jina (ODS), E2B, Serper가 실제로 토큰을 소비하지 않는 문제 -- 로그상 cache_hit만 뜨고 실제 API 호출이 일어나지 않는 것으로 보임. 도구가 DSPy ReAct에 등록은 되지만 LLM이 실제로 선택/호출하지 않거나, 호출되더라도 외부 API까지 도달하지 못하는 경로가 있을 수 있어. 내일 로그를 더 깊이 분석해보자.

> 이 글은 Sentient AGI의 오픈소스 레포를 직접 분석하며 정리한 내용이다.  
> ROMA README, ODS README를 기반으로 블록체인 리서치 에이전트에 맞게 재구성했다.

---

## 왜 ROMA인가?

AI 에이전트가 단일 쿼리에서는 잘 동작하지만, **긴 태스크에서는 에러가 누적**된다.  
99% 신뢰도의 에이전트도 10단계를 연속으로 실행하면 성공률이 급격히 떨어진다.

ROMA(Recursive Open Meta-Agent)는 이 문제를 **계층적 트리 구조**로 해결한다.  
복잡한 목표를 서브태스크로 재귀 분해하고, 독립적인 서브태스크는 병렬 실행하며, 모든 단계의 입출력을 추적 가능하게 만든다.

SEAL-0 벤치마크에서 ROMA Search가 **45.6% 달성** (Kimi Researcher 36%, Gemini 2.5 Pro 19.8% 대비).  
작성 시점 기준 **GitHub 트렌딩 1위**를 기록한 레포다.

---

## 비용 이야기

이 에이전트를 직접 세팅하면서 가장 놀란 건 비용이었다.

내가 BlueNode에서 팀원들과 작성한 RWA 리서치 시리즈 1편 수준의 퀄리티를, 이 에이전트 구조로 돌리면 **단돈 $1도 안 든다.** 직접 돌려봐야 퀄리티를 정확히 판단할 수 있겠지만, 구조상으로는 충분히 가능한 수준이다.

```
RWA 리서치 1편 기준 예상 비용: ~$0.97
```

물론 리서치의 깊이와 인사이트는 사람이 더해야 한다. 하지만 초안 작성, 데이터 수집, 구조화 작업을 에이전트가 담당하면 리서처가 집중해야 할 부분에 더 많은 시간을 쏟을 수 있다.

---

## 전체 아키텍처

```
사용자 쿼리: "Uniswap V4 후크 메커니즘과 리스크 분석"
      │
[Atomizer]    Gemini 3 Flash
      │
[Planner]     Gemini 3 Flash
      │
 ┌──────────────────────────────────┐
 ▼                                  ▼
[Search Exec]              [Market Exec]
Gemini 3.1 Pro             Gemini 3 Flash
ODS Pro                    DefiLlama
문서/논문/뉴스              CoinGecko
                            Arkham
 └──────────────────────────────────┘
      │
[Aggregator]  Gemini 3.1 Pro
      │
[Verifier]    Claude Sonnet 4.6, temperature=0
      │
최종 리포트
```

---

## 모델 선택 근거

Artificial Analysis 벤치마크 데이터를 기반으로 노드 역할에 맞게 모델을 배치했다.

### Gemini 3 Flash — Atomizer, Planner, Market Exec

빠르고 지시를 잘 따르면 충분한 노드들이다.

| 지표 | 수치 |
|------|------|
| Intelligence Index | 46 |
| IFBench (Instruction Following) | 78% |
| τ²-Bench (Tool Use) | 80% |
| Speed | 152 tok/s |
| Input Price | $0.50/1M |

Atomizer와 Planner는 정확한 추론보다 빠른 판단이 중요하다. Market Exec는 DefiLlama, CoinGecko, Arkham API를 호출하는 단순 작업이라 추론 부담이 낮다.

### Gemini 3.1 Pro — Search Exec, Aggregator

리서치 품질을 결정하는 핵심 노드들이다.

| 지표 | 수치 |
|------|------|
| Intelligence Index | 57 |
| AA-LCRL (Long Context Reasoning) | 73% |
| SciCode (Coding) | 59% |
| IFBench | 77% |
| Input Price | $2.00/1M |

Search Exec는 ODS Pro가 긁어온 긴 문서를 읽고 핵심을 추출해야 해서 Long Context가 필수다. Aggregator는 두 Executor의 결과를 합산해서 리포트 초안을 만드는 역할로, Intelligence와 Long Context 둘 다 중요하다.

### Claude Sonnet 4.6 — Verifier (temperature=0)

마지막 품질 게이트다.

| 지표 | 수치 |
|------|------|
| Intelligence Index | 44 |
| Non-Hallucination Rate | **34%** (벤치마크 내 최저) |
| Input Price | $3.00/1M |

Verifier는 최종 리포트의 환각을 잡는 역할이다. Claude Sonnet 4.6이 Non-Hallucination Rate 34%로 데이터 내 가장 정확하다. temperature=0으로 고정해서 결정론적 검증을 수행한다.

---

## ROMA 5개 노드 구성

| 노드 | 역할 | 모델 | 전략 |
|------|------|------|------|
| **Atomizer** | 태스크 복잡도 판단 (atomic vs plan) | Gemini 3 Flash | CoT |
| **Planner** | 서브태스크 분해 + 의존성 그래프 | Gemini 3 Flash | CoT |
| **Search Exec** | 문서/논문/뉴스 리서치 (ODS Pro) | Gemini 3.1 Pro | ReAct |
| **Market Exec** | 온체인 수치 수집 (DefiLlama, CoinGecko, Arkham) | Gemini 3 Flash | ReAct |
| **Aggregator** | 서브태스크 결과 통합 | Gemini 3.1 Pro | CoT |
| **Verifier** | 최종 결과물 검증 (verdict + feedback) | Claude Sonnet 4.6 | Predict |

Executor를 Search와 Market 두 가지로 분리하는 게 핵심이다. 태스크 성격이 다른 것을 같은 Executor에 넣으면 툴 충돌이나 프롬프트 오염이 생긴다.

---

## ROMA 내장 툴킷

블록체인 리서치에 필요한 것들이 이미 내장되어 있다.

```
Core:      FileToolkit, CalculatorToolkit
Crypto:    CoinGeckoToolkit, DefiLlamaToolkit, ArkhamToolkit
Search:    SerperToolkit
Universal: MCPToolkit (모든 MCP 서버 연결 가능)
```

별도 커스텀 툴킷 없이 바로 시작할 수 있다.

---

## ODS (OpenDeepSearch)

ODS는 ROMA Search Exec에 Tool로 연결하는 **딥서치 엔진**이다.

기존 오픈소스 검색 도구와의 차이점:
- 쿼리를 재구성해서 **암묵적 의도까지 파악**
- 결과를 청킹 + 리랭킹해서 **관련성 높은 것만 필터**
- 추가 검색이 필요하면 **스스로 판단해서 재검색**

### 두 가지 모드

| 모드 | 특징 | 적합한 용도 |
|------|------|-------------|
| **Default** | 빠름, 단순 쿼리 | 기본 정보 확인 |
| **Pro** | 웹 크롤링 + 시맨틱 리랭킹 | 논문, Whitepaper, 멀티홉 분석 |

블록체인 리서치에서는 프로토콜 문서/논문/뉴스 분석에 **Pro Mode**를 사용한다.  
가격/TVL 같은 수치 데이터는 Market Exec의 전용 Toolkit이 담당한다.

---

## 실제 설치 과정 (WSL2 Ubuntu 22.04 기준)

> Windows 네이티브에서는 `fasttext-wheel` C++ 빌드 문제로 ODS 설치가 실패한다.  
> WSL2 Ubuntu 환경에서 진행해야 한다.

### 환경 준비

```bash
# conda 환경 생성 (Python 3.12)
conda create -n research-agent python=3.12 -y
conda activate research-agent

# 작업 폴더 생성
mkdir ~/research-agent
cd ~/research-agent
```

### ROMA 설치

PyPI에 아직 배포되지 않아서 GitHub에서 직접 설치한다.

```bash
# uv 설치
pip install uv

# ROMA 클론 및 설치
git clone https://github.com/sentient-agi/ROMA.git
cd ROMA
uv pip install -e .

# 설치 확인
python -c "from roma_dspy.core.engine.solve import solve; print('ROMA OK')"
```

`ROMA OK` 출력되면 성공이다. 아래 두 warning은 무시해도 된다.
- `libtmux not installed` → 터미널 세션 기능, 우리 용도에 불필요
- `Applied CodeAct patch` → 정상 동작 메시지

### ODS 설치

```bash
cd ~/research-agent

# ODS 클론
git clone https://github.com/sentient-agi/OpenDeepSearch.git
cd OpenDeepSearch

# 설치
uv pip install -e .
uv pip install -r requirements.txt
```

ODS는 `langchain.text_splitter` 모듈 경로가 구버전 기준이라 수동 수정이 필요하다.

```bash
# 소스 코드 수정 (한 줄)
sed -i 's/from langchain.text_splitter/from langchain_text_splitters/g' \
  src/opendeepsearch/context_building/build_context.py
```

누락 패키지 추가 설치:

```bash
uv pip install torch --index-url https://download.pytorch.org/whl/cpu
uv pip install langchain-text-splitters nest-asyncio sentence-transformers einops
```

설치 확인:

```bash
python -c "from opendeepsearch import OpenDeepSearchTool; print('ODS OK')"
```

`ODS OK` 출력되면 완료다.

---

## API 키 설정

```bash
cat >> ~/.bashrc << 'EOF'

# LLM (OpenRouter로 통합 — Gemini + Claude 한 번에)
export OPENROUTER_API_KEY="sk-or-v1-..."

# ODS 검색
export SERPER_API_KEY="..."
export JINA_API_KEY="..."

# 크립토 데이터
export COINGECKO_API_KEY="..."
EOF

source ~/.bashrc
```

| 서비스 | 용도 | 비용 |
|--------|------|------|
| [OpenRouter](https://openrouter.ai) | Gemini + Claude 통합 관리 | 종량제 |
| [Serper.dev](https://serper.dev) | ODS 웹 검색 | 무료 2500 크레딧 |
| [Jina AI](https://jina.ai) | ODS 리랭커 | 무료 플랜 |
| [CoinGecko](https://www.coingecko.com/api) | 크립토 시세 | 무료 플랜 |

> Anthropic 키는 따로 발급하지 않아도 된다. OpenRouter에서 Claude Sonnet 4.6도 지원하기 때문에 OpenRouter 키 하나로 모든 모델을 관리할 수 있다.

---

## ROMA config 모델 프리픽스 수정

ROMA 기본 config가 `google/gemini-2.5-flash` 형식으로 되어있어서 OpenRouter에서 인식을 못한다. `openrouter/` 프리픽스를 추가해줘야 한다.

```bash
cd ~/research-agent/ROMA
sed -i 's/google\/gemini-2.5-flash/openrouter\/google\/gemini-2.5-flash/g' config/defaults/config.yaml
sed -i 's/anthropic\/claude-sonnet-4.5/openrouter\/anthropic\/claude-sonnet-4.5/g' config/defaults/config.yaml
```

---

## 첫 실행 결과

설정 완료 후 바로 실행해봤다.

```bash
roma-dspy solve "What is Uniswap V4?"
```

![에이전트 테스트 쿼리 결과](/assets/img/에이전트테스트쿼리결과.png)

Hooks, Singleton Contract Architecture, Flash Accounting, Native ETH Support까지 핵심 내용이 구조적으로 잘 정리됐다. Atomizer → Planner → Executor → Aggregator → Verifier 전체 파이프라인이 정상 동작한 것이다.

---

## TUI 시각화

Docker를 올리면 실행 흐름을 터미널에서 시각적으로 확인할 수 있다.

```bash
# Docker 설치 및 실행
sudo apt install docker.io docker-compose-v2 -y
sudo systemctl start docker
sudo usermod -aG docker $USER

# just 설치
sudo snap install just --classic

# ROMA Docker 서비스 올리기
cd ~/research-agent/ROMA
just docker-up

# 실행 시각화
just viz <execution_id>
```

![ROMA TUI 시각화](/assets/img/roma-tui-viz.png)

Sentient 로고와 함께 실행 트리가 터미널에 렌더링된다. 각 노드의 실행 상태, 소요 시간, 결과를 한눈에 볼 수 있다.

---

## 커스텀 파이프라인 코드

```python
import dspy
from roma_dspy import Aggregator, Atomizer, Executor, Planner, Verifier, SubTask
from opendeepsearch import OpenDeepSearchTool

search_tool = OpenDeepSearchTool(
    model_name="openrouter/google/gemini-2.5-flash",
    reranker="jina"
)

atomizer = Atomizer(lm=dspy.LM("openrouter/google/gemini-2.5-flash", temperature=0.6), prediction_strategy="cot")
planner  = Planner(lm=dspy.LM("openrouter/google/gemini-2.5-flash", temperature=0.85), prediction_strategy="cot")
executor = Executor(lm=dspy.LM("openrouter/google/gemini-2.5-flash", temperature=0.7), prediction_strategy="react", tools=[search_tool])
aggregator = Aggregator(lm=dspy.LM("openrouter/google/gemini-2.5-flash", temperature=0.65), prediction_strategy="cot")
verifier = Verifier(lm=dspy.LM("openrouter/google/gemini-2.5-flash", temperature=0.0))

def run_pipeline(goal):
    atomized = atomizer.forward(goal)
    if atomized.is_atomic or atomized.node_type.is_execute:
        execution = executor.forward(goal)
        candidate = execution.output
    else:
        plan = planner.forward(goal)
        subtask_results = []
        for subtask in plan.subtasks:
            execution = executor.forward(subtask.goal)
            st = SubTask(goal=subtask.goal, task_type=subtask.task_type, dependencies=subtask.dependencies)
            subtask_results.append(st)
        aggregated = aggregator.forward(goal, subtask_results)
        candidate = aggregated.synthesized_result
    verdict = verifier.forward(goal, candidate)
    if verdict.verdict:
        return candidate
    return candidate

print(run_pipeline("Uniswap V4 후크 메커니즘과 리스크 분석해줘"))
```

---

## 실행 환경 구성

| 레이어 | 역할 | 비고 |
|--------|------|------|
| **WSL2 Ubuntu 22.04** | ROMA 실행, 오케스트레이션 | Python 3.12 |
| **OpenRouter** | Gemini + Claude 통합 | 멀티모델 한 번에 관리 |
| **Docker** | PostgreSQL, MLflow, TUI 시각화 | `just docker-up` 한 번으로 |
| **외부 API** | 온체인 데이터 | CoinGecko, DefiLlama, Arkham |

노트북이 꺼져 있으면 에이전트가 동작하지 않는다. 24시간 운영이 필요하면 VPS 배포를 고려.

---

## 요약

```
ROMA             = 에이전트 오케스트레이터 (태스크 분해 + 병렬 실행)
ODS              = 딥서치 엔진 (Search Exec의 Tool로 연결)
Gemini 3 Flash   = 빠른 판단 + API 호출 (Atomizer, Planner, Market Exec)
Gemini 3.1 Pro   = 핵심 추론 (Search Exec, Aggregator)
Claude Sonnet    = 최종 환각 검증 (Verifier, temp=0)
비용             = RWA 리서치 1편 수준 ~$0.97
```

Search와 Market Executor를 분리하고, 노드 역할에 맞는 모델을 배치하는 것이 이 설계의 핵심이다.

Sentient가 만든 세 개의 오픈소스 — ROMA, ODS, CryptoAnalystBench — 를 조합하면,  
별도 프레임워크 없이 블록체인 리서치 에이전트의 **구축 → 실행 → 평가** 사이클을 완성할 수 있다.

---

## 참고 링크

- [ROMA GitHub](https://github.com/sentient-agi/ROMA)
- [OpenDeepSearch GitHub](https://github.com/sentient-agi/OpenDeepSearch)
- [CryptoAnalystBench GitHub](https://github.com/sentient-agi/CryptoAnalystBench)
- [Sentient Blog - ROMA 소개](https://www.sentient.xyz/blog/recursive-open-meta-agent)
- [Artificial Analysis LLM Leaderboard](https://artificialanalysis.ai)







ROMA 깃허브 트렌딩 1위인거 쓰기

그리고 내 RWA 리서치 1편 정도 퀄리티의 리서치 지금 에이전트 구조로 얼마면 작성할 수 있느냐 했는데, 1달러도 안 필요한단다. perplexity 판단이지만, 단돈 $0.97로 1편을 수정한 리서치의 퀄리티를 뽑을 수 있단다. 결과를 직접 뽑아봐야 알겠지만, 정말 대단한데? 


openrouter
serper
jina
api 설정하고

(research-agent) sgh_3591@GHGalaxyBook5Pro:~/research-agent/ROMA$ sed -i 's/google\/gemini-2.5-flash/openrouter\/google\/gemini-2.5-flash/g' config/defaults/config.yaml
(research-agent) sgh_3591@GHGalaxyBook5Pro:~/research-agent/ROMA$ sed -i 's/anthropic\/claude-sonnet-4.5/openrouter\/anthropic\/claude-sonnet-4.5/g' config/defaults/config.yaml
(research-agent) sgh_3591@GHGalaxyBook5Pro:~/research-agent/ROMA$ roma-dspy solve "What is Uniswap V4?"

했더니 결과

╭─────────────────────────────────────────────────────── Result ───────────────────────────────────────────────────────╮
│ Uniswap V4 is the fourth major version of the Uniswap decentralized exchange (DEX) protocol, released in 2024. It    │
│ represents a significant evolution in automated market maker (AMM) technology with several groundbreaking features:  │
│                                                                                                                      │
│ **Key Features:**                                                                                                    │
│                                                                                                                      │
│ 1. **Hooks**: The most revolutionary feature - customizable smart contracts that execute at specific points in a     │
│ pool's lifecycle (before/after swaps, liquidity changes, etc.). This allows developers to build custom AMM logic,    │
│ implementing features like:                                                                                          │
│    - Dynamic fees based on volatility                                                                                │
│    - Time-weighted average market makers (TWAMM)                                                                     │
│    - Limit orders                                                                                                    │
│    - Custom oracles                                                                                                  │
│    - Liquidity management strategies                                                                                 │
│                                                                                                                      │
│ 2. **Singleton Contract Architecture**: Unlike V3's factory pattern, V4 uses a single contract to manage all pools,  │
│ significantly reducing gas costs for pool creation and multi-hop swaps.                                              │
│                                                                                                                      │
│ 3. **Flash Accounting**: A new accounting system that only settles net balances at the end of a transaction,         │
│ reducing gas costs for complex operations by up to 99% in some cases.                                                │
│                                                                                                                      │
│ 4. **Native ETH Support**: V4 brings back native ETH trading pairs (removed in V3), reducing gas costs for ETH       │
│ trades.                                                                                                              │
│                                                                                                                      │
│ 5. **Custom Pool Fees**: Greater flexibility in fee structures beyond the preset tiers in V3.                        │
│                                                                                                                      │
│ 6. **ERC-1155 Accounting**: More efficient token accounting for liquidity positions.                                 │
│                                                                                                                      │
│ **Improvements Over V3:**                                                                                            │
│ - Dramatically lower gas costs (estimated 50-90% reduction in various operations)                                    │
│ - Infinite customizability through hooks                                                                             │
│ - Better capital efficiency                                                                                          │
│ - Enhanced developer experience                                                                                      │
│                                                                                                                      │
│ **Significance:**                                                                                                    │
│ Uniswap V4 essentially transforms Uniswap from a fixed-function DEX into a customizable platform where developers    │
│ can build tailored AMM experiences while benefiting from Uniswap's liquidity and security infrastructure.            │
╰──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯


![alt text](/assets/img/에이전트테스트쿼리결과.png)



도커로 뭐 했더니


![도커 실행 결과 ROMA TUI](/assets/img/roma-tui-viz.png)

이런게 생긴다!


역할모델명가격Atomizer, Planner, Market Execgoogle/gemini-3-flash-preview$0.50/MSearch Exec, Aggregatorgoogle/gemini-3.1-pro-preview$2/MVerifieranthropic/claude-sonnet-4.6$3/M

모델 바꿔서 테스트해봤는데, 로그가 이렇게 뜬다!!

![모델 변경 후 ROMA 실행 로그](/assets/img/roma-model-test-logs.png)

결과

**What is Uniswap V4?**

Uniswap V4 is the latest iteration of the Uniswap decentralized exchange (DEX) protocol on Ethereum. It introduces highly customizable liquidity pools and significant gas optimizations, shifting Uniswap from a rigid protocol into a flexible platform for decentralized finance (DeFi) developers.

The core innovations of Uniswap V4 include:
*   **Hooks:** This is the flagship feature of V4. Hooks are externally deployed smart contracts that execute custom logic at specific points in a pool's lifecycle (e.g., before or after a swap, or when liquidity is added/removed). This allows developers to create pools with dynamic fees, on-chain limit orders, Time-Weighted Average Market Makers (TWAMM), and custom oracle implementations.
*   **Singleton Architecture:** Unlike previous versions where every liquidity pool was a separate smart contract, V4 houses all pools within a single "Singleton" contract. This drastically reduces the gas costs associated with creating new pools and routing trades across multiple different pools (multi-hop swaps).
*   **Flash Accounting:** Leveraging Ethereum's EIP-1153 (transient storage), V4 uses a "flash accounting" system. Instead of transferring assets back and forth during a complex multi-hop trade, the protocol only calculates the net balance changes and requires a single transfer at the very end of the transaction, saving significant gas.

---

**Key Risks of Uniswap V4**

While Uniswap V4 offers unprecedented flexibility, this customizability introduces new vectors of risk, primarily centered around the use of Hooks.

**1. Hook Security and Smart Contract Risks**
*   **Malicious Hooks:** Because anyone can deploy a hook, malicious actors can create hooks designed to steal funds, manipulate swap outcomes, or trap user liquidity. Users interacting with a customized pool must now audit or trust the specific hook attached to it, moving away from Uniswap's traditionally "trustless" model.
*   **Vulnerabilities in Hook Logic:** Even well-intentioned hooks can contain bugs. A vulnerability in a hook's smart contract could compromise the entire pool it is attached to, leading to a loss of funds for liquidity providers (LPs) or swappers.

**2. Liquidity Fragmentation**
*   In Uniswap V3, liquidity was fragmented across a few fee tiers (e.g., 0.05%, 0.3%, 1%). In V4, because every pool can have a unique hook and custom fee structure, liquidity for a single token pair (like USDC/ETH) could become highly fragmented across dozens of slightly different pools. This fragmentation can lead to higher slippage and worse execution prices for traders.

**3. Increased System Complexity**
*   The combination of singleton architecture, flash accounting, and dynamic hooks makes V4 vastly more complex than V3. This complexity makes it harder for integrators (wallets, aggregators, and other DeFi protocols) to safely route trades and manage positions.

**4. Gas Cost Uncertainty**
*   While the Singleton and Flash Accounting features are designed to reduce gas costs, complex hooks could do the opposite. A poorly optimized hook that executes heavy computational logic before and after every swap could make trading in that pool prohibitively expensive, potentially leading to out-of-gas transaction failures during periods of high network congestion.

쿼리 비용 $0.100
모델비용 합계호출 수
Claude Sonnet 4.6 $0.00786 1회
Gemini 3.1 Pro $0.08713 10회
Gemini 3 Flash $0.00531 5회
합계 $0.100 16회




DefiLlama + CoinGecko + Binance
툴킷 추가

**Uniswap V4 후크 메커니즘 및 리스크 분석 보고서**

**1. Uniswap V4 아키텍처 및 싱글톤(Singleton) 모델**
Uniswap V4는 기존 V3의 팩토리(Factory) 모델을 벗어나, 모든 유동성 풀(Pool)을 단일 컨트랙트에서 관리하는 **싱글톤(Singleton) 아키텍처**를 도입했습니다. 이를 통해 새로운 풀 생성 비용을 크게 낮추고, 여러 풀을 거치는 다중 홉 스왑(Multi-hop swap) 시 발생하는 가스비를 대폭 절감했습니다. 또한, '플래시 어카운팅(Flash Accounting)'을 도입하여 스왑 과정의 매 단계마다 토큰을 전송하지 않고 최종 순 잔액(Net balance)만 정산함으로써 가스 효율성을 극대화했습니다.

**2. 후크(Hooks) 메커니즘의 기술적 작동 원리**
후크는 유동성 풀의 라이프사이클 내 특정 지점에서 커스텀 로직을 실행할 수 있도록 연결된 외부 스마트 컨트랙트입니다. 이를 통해 개발자는 AMM 코어 로직을 수정하지 않고도 풀의 동작을 커스터마이징할 수 있습니다.

* **작동 시점 (Execution Points):**
  * `beforeInitialize` / `afterInitialize`: 풀이 처음 생성되고 초기화될 때
  * `beforeModifyPosition` / `afterModifyPosition`: 유동성 공급자(LP)가 유동성을 추가하거나 제거할 때
  * `beforeSwap` / `afterSwap`: 사용자가 스왑을 실행할 때
  * `beforeDonate` / `afterDonate`: 풀에 토큰을 기부할 때
* **인터페이스 및 실행 방식:**
  풀을 생성할 때 연결되는 후크 컨트랙트 주소의 앞자리(Prefix) 비트맵(Bitmap)을 통해 어떤 시점에 후크가 실행될지 결정합니다. 이는 불필요한 함수 호출을 막아 가스 낭비를 방지하는 효율적인 구조입니다.

**3. 후크를 활용한 주요 유스케이스**
* **동적 수수료 (Dynamic Fees):** 시장 변동성이나 거래량 등 온체인 데이터에 따라 거래 수수료를 실시간으로 조정하여 LP의 비영구적 손실(IL)을 방지하고 수익을 최적화합니다.
* **온체인 지정가 주문 (On-chain Limit Orders):** 특정 가격에 도달했을 때 스왑을 실행하는 로직을 후크에 구현하여, 별도의 외부 프로토콜 없이도 AMM 내에서 지정가 주문을 지원합니다.
* **사용자 정의 오라클 (Custom Oracles):** 기존의 TWAP(시간 가중 평균 가격)뿐만 아니라 기하평균, 변동성 기반 오라클 등 다양한 형태의 가격 오라클을 풀 단위로 구축할 수 있습니다.
* **MEV 수익 재분배:** 스왑 전후로 발생하는 차익거래(Arbitrage) 기회를 후크가 포착하여, 발생한 MEV(최대 추출 가능 가치) 수익을 LP에게 환원하는 구조를 만들 수 있습니다.

**4. 후크 도입에 따른 리스크 분석**
후크는 강력한 유연성을 제공하지만, 외부 로직이 개입됨에 따라 새로운 보안 및 운영 리스크를 동반합니다.

* **보안 리스크 (Security Risks):**
  * **악성 후크 로직:** 후크는 외부 컨트랙트이므로 악의적인 개발자가 사용자 자금을 탈취하거나 스왑을 방해하는 백도어를 심을 수 있습니다. 사용자는 스왑 전 해당 풀의 후크가 신뢰할 수 있는지(오딧 여부 등) 검증해야 합니다.
  * **재진입 공격 (Reentrancy Attacks):** 후크 실행 중 Uniswap 코어 컨트랙트를 다시 호출하거나 다른 복잡한 디파이 프로토콜과 상호작용할 때, 예기치 않은 재진입 취약점이 발생할 수 있습니다.
* **운영 및 가스 리스크 (Operational & Gas Risks):**
  * **가스비 급증:** 후크 로직이 지나치게 복잡하거나 비효율적으로 작성될 경우, 스왑 및 유동성 제공 시 가스비가 급증하여 싱글톤 아키텍처의 가스 절감 이점을 상쇄시킬 수 있습니다.
  * **유동성 파편화 및 라우팅 복잡성:** 너무 다양한 커스텀 후크(예: 특정 조건을 만족해야만 스왑이 가능한 풀)가 존재하면, 애그리게이터나 라우터가 최적의 스왑 경로를 찾기 어려워져 유동성 파편화(Liquidity Fragmentation)가 심화될 수 있습니다.

**5. 결론**
Uniswap V4의 후크 메커니즘은 AMM을 고도로 모듈화하여 디파이 생태계에 무한한 확장성을 제공합니다. 개발자들은 후크를 통해 자신만의 독창적인 금융 모델을 실험할 수 있습니다. 그러나 외부 로직 결합으로 인한 보안 취약점과 가스비 최적화 문제는 해결해야 할 핵심 과제입니다. 따라서 향후 V4 생태계가 안정적으로 자리 잡기 위해서는 철저한 스마트 컨트랙트 감사(Audit)와 안전한 후크 개발을 위한 표준 가이드라인 마련이 필수적일 것입니다.

쿼리 비용 $0.271
모델비용 합계호출 수
Claude Sonnet 4.6 $0.0114 1회
Gemini 3.1 Pro $0.247 19회
Gemini 3 Flash $0.0132 11회
합계 $0.271 31회


Aggregator 개선

# 유니스왑 V4(Uniswap V4) 후크(Hooks) 메커니즘 및 리스크 분석 보고서

유니스왑 V4는 탈중앙화 거래소(DEX)의 유연성과 자본 효율성을 극대화하기 위해 **'싱글톤(Singleton) 아키텍처'**와 **'후크(Hooks)'**라는 혁신적인 메커니즘을 도입했습니다. 이를 통해 개발자는 고도로 맞춤화된 유동성 풀을 설계할 수 있게 되었으나, 동시에 새로운 보안 및 운영 리스크가 발생하게 되었습니다.

---

## 1. 유니스왑 V4 아키텍처와 후크(Hooks)의 개념

### 1.1. 싱글톤(Singleton) 아키텍처와 플래시 회계(Flash Accounting)
기존 V3에서는 새로운 유동성 풀이 생성될 때마다 개별 스마트 컨트랙트를 배포해야 했습니다. 반면 V4는 **모든 유동성 풀을 단일 스마트 컨트랙트 내에서 통합 관리하는 '싱글톤 모델'**을 채택했습니다.
* **가스비 절감:** 여러 풀을 거치는 멀티홉(Multi-hop) 스왑 시 컨트랙트 간 토큰 전송이 필요 없어 가스비가 크게 절감됩니다.
* **최신 기술 적용:** 이더리움 덴쿤 업그레이드의 임시 저장소(EIP-1153, Transient Storage)와 ERC-6909 토큰 표준을 활용해 상태 관리 및 다단계 트랜잭션을 최적화합니다.
* **플래시 회계:** 스왑 시 토큰의 실제 이동을 최소화하고 최종 순 차액만 정산하여 연산 비용을 획기적으로 줄입니다.

### 1.2. 후크(Hooks)란?
후크는 유동성 풀의 생명주기(Lifecycle) 중 특정 시점에 개발자가 원하는 **사용자 정의 로직(Custom Logic)**을 실행할 수 있도록 하는 외부 스마트 컨트랙트입니다. 기존의 획일화된 AMM 모델에서 벗어나 프로그래밍 가능한 유동성 플랫폼으로의 진화를 가능하게 합니다.

---

## 2. 후크(Hooks)의 기술적 작동 원리

### 2.1. 작동 시점 (Execution Timing)
후크는 풀의 상태가 변경되는 4가지 핵심 액션을 기준으로, 각각의 **실행 전(Before)**과 **실행 후(After)** 총 8개의 주요 시점에서 작동하도록 설계되었습니다.
1. **Initialize:** 유동성 풀이 처음 생성(초기화)될 때 (`beforeInitialize`, `afterInitialize`)
2. **Modify Position:** LP가 유동성을 추가하거나 제거할 때 (`beforeAddLiquidity`, `afterRemoveLiquidity` 등)
3. **Swap:** 사용자가 토큰을 스왑(거래)할 때 (`beforeSwap`, `afterSwap`)
4. **Donate:** 유동성 공급자에게 토큰을 기부할 때 (`beforeDonate`, `afterDonate`)

### 2.2. 주소 비트마스킹 (Address Bitmasking)을 통한 구현
유니스왑 V4는 가스 효율성을 극대화하기 위해 컨트랙트 함수를 매번 조회하는 대신, **후크 컨트랙트 주소 자체에 활성화 여부를 인코딩**하는 독특한 방식을 사용합니다.
* **14비트 플래그:** 후크가 어느 시점에 실행될지 결정하는 14개의 플래그가 후크 컨트랙트 배포 주소의 최하위 14비트(Least Significant Bits)에 인코딩됩니다.
* **가스 최적화:** 프로토콜은 이벤트 발생 시 주소의 비트마스크를 확인하여 비트가 `1`인 경우에만 로직을 호출하고, `0`이면 생략하여 가스를 절약합니다.
* **주소 마이닝 (Address Mining):** 개발자는 `CREATE2` 옵코드를 활용해 자신이 원하는 실행 조건(비트마스크 패턴)과 정확히 일치하는 주소가 나올 때까지 해시를 계산(마이닝)하여 후크를 배포해야 합니다.

---

## 3. 후크를 활용한 주요 유스케이스

* **동적 수수료 (Dynamic Fees):** 고정된 수수료 대신 시장 변동성에 따라 실시간으로 수수료율을 조정하여 LP의 비영구적 손실(IL)을 방어하고 자본 효율성을 높입니다.
* **온체인 지정가 주문 (On-chain Limit Orders):** 스왑 후(Post-Swap) 후크나 틱(Tick) 이동 트리거를 통해 특정 가격에 도달했을 때만 거래가 체결되도록 중앙화 거래소(CEX) 수준의 기능을 온체인에 구현합니다.
* **맞춤형 오라클 (Custom Oracles):** 풀 자체가 내장 오라클 역할을 하거나 외부 데이터를 결합하여 조작에 강한 맞춤형 가격 피드를 제공합니다.
* **TWAMM (시간 가중 평균 마켓 메이커):** 대규모 주문을 장기간에 걸쳐 분할 실행하여 가격 슬리피지와 시장 충격을 최소화합니다.

---

## 4. 후크 도입에 따른 리스크 분석

후크는 임의의 외부 코드를 풀의 핵심 로직과 결합하므로, 잘못 설계되거나 악용될 경우 심각한 취약점을 초래할 수 있습니다.

### 4.1. 보안 리스크 (Security Risks)
* **재진입 공격 (Reentrancy Attacks):** 후크는 핵심 작업 전후에 외부 호출(External calls)을 수행합니다. 악의적인 컨트랙트가 상태 업데이트 완료 전에 풀 매니저(Pool Manager)로 재진입하여 잔고나 상태를 조작하고 자금을 탈취할 수 있습니다.
* **접근 제어 실패 (Access Control Failures):** 후크는 승인된 주체(`PoolManager`)에 의해서만 호출되어야 합니다. 검증 로직이 누락되면 공격자가 후크를 직접 호출해 임의로 상태를 조작할 수 있습니다.
* **악성 후크 로직 (Malicious Hooks & Rug Pulls):** 누구나 무허가(Permissionless)로 후크를 배포할 수 있어, 수수료를 빼돌리거나 유동성을 가로채는 악의적인 러그풀 코드가 삽입될 위험이 존재합니다.

### 4.2. 운영 및 경제적 리스크 (Operational & Economic Risks)
* **가스 그리핑 및 DoS (Gas Griefing & Denial of Service):** 후크는 트랜잭션의 핵심 경로에서 실행됩니다. 악의적이거나 최적화되지 않은 후크가 무한 루프를 돌거나 과도한 스토리지를 사용하여 가스를 고갈시키면, 정상적인 스왑이나 유동성 공급을 마비시키는 DoS 상태를 유발할 수 있습니다.
* **MEV 및 프론트러닝 노출:** 후크로 인해 트랜잭션 로직이 복잡해지면 실행 순서가 수익에 큰 영향을 미칩니다. 악의적인 봇이 이를 악용해 프론트러닝이나 샌드위치 공격을 가할 확률이 높아집니다.
* **연산 정밀도 손실:** 동적 수수료 등 복잡한 수식 처리 시 정수 연산의 반올림 오류나 정밀도 손실이 발생하여 경제적 오차를 악용당할 수 있습니다.

---

## 5. 결론

유니스왑 V4의 후크(Hooks) 메커니즘은 단순한 DEX를 넘어 **'프로그래밍 가능한 유동성 플랫폼'**으로 생태계를 진화시키는 강력한 도구입니다. 싱글톤 아키텍처와 결합하여 가스비를 최적화하면서도 창의적인 금융 상품을 온체인에 구현할 수 있게 해줍니다.

하지만 외부 코드의 개입을 허용하는 만큼 **재진입 공격, 가스 그리핑, 악성 로직 삽입** 등 다양한 보안 및 운영 리스크가 수반됩니다. 따라서 개발자는 후크 설계 시 엄격한 스마트 컨트랙트 감사(Audit)와 가스 한도 설정을 거쳐야 하며, 사용자는 상호작용하는 풀의 후크가 신뢰할 수 있는지 철저히 검증(화이트리스트 등)하는 주의가 필요합니다.


쿼리 비용 $0.252
모델비용 합계호출 수
Claude Sonnet 4.6 $0.0153 1회
Gemini 3.1 Pro $0.2278 12회
Gemini 3 Flash $0.0090 7회
합계 $0.252 20회


비용은 낮아지고, 퀄리티는 올라갔다.
gemini의 평가
에이전트의 프롬프트(특히 Aggregator)를 어떻게 깎으셨길래, 툴킷을 무작정 붙였을 때(Run 2)보다 비용을 절감하면서 문서의 깊이를 이더리움 EVM 옵코드 수준까지 끌어올릴 수(Run 3) 있었는지 그 최적화 노하우가 정말 궁금해지네요!
ㅋㅋ
그냥 aggregator를 추가한 것뿐


RWA 리서치 1편과 비교하기위하나 쿼리
python ~/research-agent/blockchain_agent.py "RWA 시장 구조를 분석해줘. 스테이블코인 제외 전체 시장 규모, 자산군별 구성 비중, 레포 계약이 시장에서 차지하는 의미, 분산형 vs 표현형 자산의 차이와 시사점을 한국어 리서치 리포트 형식으로 작성해줘."

# [리서치 리포트] RWA 시장 구조 분석: 시장 규모, 레포 계약의 역할, 그리고 자산 분류별 시사점

## 1. RWA 시장 규모 및 자산군별 구성 현황 (스테이블코인 제외)

**시장 규모 추이 및 성장 동력**
최근 RWA(Real World Asset) 시장은 폭발적인 성장세를 보이고 있습니다. 스테이블코인을 제외한 RWA 시장 규모는 최근 약 267억 8천만 달러(약 35조 원) 규모로 급성장했습니다. 이러한 성장의 핵심 견인차는 사모 신용(Private Credit)과 미국 국채(US Treasuries)의 토큰화입니다.

**자산군별 구성 비중**
* **미국 국채 및 펀드 (약 80%):** 고금리 거시경제 환경 속에서 안전자산에 대한 수요가 증가함에 따라, 미국 국채와 사모펀드 등 전통 금융자산의 토큰화가 전체 시장의 약 80%를 차지하며 시장을 주도하고 있습니다.
* **부동산 및 미술품 등 실물자산 (5% 미만):** 전통적인 의미의 실물자산(부동산, 미술품 등) 토큰화는 아직 전체의 5% 미만에 불과하여 초기 단계에 머물러 있습니다. 다만, 인프라가 성숙함에 따라 장기적으로는 가장 큰 비중을 차지할 잠재력을 지닌 자산군으로 평가받고 있습니다.
* **기타 자산:** 토큰화된 금(Gold)과 같은 원자재 및 실험적 금융 상품들이 나머지 비중을 구성하고 있습니다.

## 2. RWA 시장 내 온체인 레포(Repo) 계약의 의미

전통 금융의 환매조건부채권(Repo) 시장을 블록체인에 구현한 '온체인 레포 계약(예: Ondo Finance의 Flux Finance)'은 RWA 생태계의 유동성과 신용 창출에 있어 중대한 의미를 지닙니다.

**유동성 측면의 시사점**
* **자본 효율성 극대화:** 투자자는 토큰화된 우량 자산(예: 국채 토큰)을 매각하지 않고 스마트 컨트랙트에 담보로 예치하여 즉각적으로 스테이블코인을 대출받을 수 있습니다.
* **TradFi와 DeFi의 연결:** 비유동적인 전통 금융(TradFi) 자산에 24시간 접근 가능한 탈중앙화 금융(DeFi)의 풍부한 유동성을 연결하는 핵심 교량 역할을 수행합니다.

**신용 창출(Credit Creation) 측면의 시사점**
* **안정적인 신용 생태계 구축:** 기존 암호화폐 중심의 DeFi 대출 시장은 높은 변동성으로 인한 연쇄 청산 위험이 존재했습니다. 반면, 가치가 안정적인 RWA를 담보로 하는 온체인 레포는 시스템 내 변동성을 억제하고 견고한 신용 생태계를 조성합니다.
* **무위험 이자율(Risk-free Rate) 도입:** 국채 금리에 기반한 전통 금융의 무위험 이자율 기준이 온체인 생태계에 편입됨으로써, 향후 더욱 고도화된 온체인 파생상품과 신용 모델이 탄생할 수 있는 기반을 제공합니다.

## 3. 분산형 자산(Native On-chain) vs 표현형 자산(Off-chain backed) 비교 및 시사점

RWA는 태생적 위치에 따라 '분산형 자산'과 '표현형 자산'으로 분류되며, 각각 명확히 다른 기술적, 법률적, 운용적 특징을 가집니다.

| 구분 | 분산형 자산 (Native On-chain Assets) | 표현형 자산 (Off-chain Backed Assets) |
| :--- | :--- | :--- |
| **개념** | 발행부터 소각까지 전체 생애주기가 블록체인 상에서 이루어지는 자산 (토큰 자체가 원본) | 현실 세계의 실물 자산을 담보로 하여 블록체인 상에 가치를 연동(Mirroring)한 자산 |
| **기술적 구현** | 스마트 컨트랙트만으로 통제 가능, 오프체인 의존도 낮음, 높은 결합성(Composability) | 오프체인 상태 반영을 위한 **오라클(Oracle)** 및 **수탁(Custody)** 인프라 필수적 |
| **법률적 쟁점** | 분산원장 기록 자체가 기존 법적 장부와 동일한 효력을 갖도록 하는 **법제화**가 핵심 | 토큰 보유자의 실물 자산 권리 주장을 위한 **신탁 계약, SPV 설립, 도산 절연** 장치 핵심 |
| **운용적 시사점** | 중개자 없는 즉각적 결제로 자본 효율성 극대화. 단, **온체인 보안 리스크(해킹 등)** 관리 집중 필요 | 복잡한 온·오프체인 동기화 비용 발생. **준비금 증명(PoR)** 및 수탁 기관 리스크 관리 필수 |

## 4. 결론

현재의 RWA 시장은 스테이블코인을 넘어 미국 국채 등 금융자산을 중심으로 폭발적인 양적 성장을 이룩하고 있습니다. 특히 온체인 레포 계약의 등장은 전통 자산의 신뢰성과 블록체인의 유동성을 결합하여 DeFi 생태계에 건전한 신용 창출을 견인하고 있습니다.

향후 RWA 시장이 부동산 등 진정한 의미의 실물자산으로 확장되고 질적 성장을 이루기 위해서는, 자산의 태생적 특성(분산형 vs 표현형)에 맞춘 정교한 기술적 인프라 구축(오라클, PoR 등)과 명확한 법률적 권리 보장(도산 절연, 원장의 법적 효력 인정)이 선결되어야 할 것입니다.

비용 $0.295
모델비용 합계호출 수
Claude Sonnet 4.6 $0.0145 1회
Gemini 3.1 Pro $0.2648 19회
Gemini 3 Flash $0.0155 11회
합계 $0.295 31회



이게 타이거 리서치에서 배웠던 AI 시대에 경쟁력을 잃은 정보 축약형 리서치겠다. 물론 이런 내용도 구성에 필요하지만, 내러티브, 서사, 인사이틀를 던지는 주장형 리서치를 쓰도록 노력하자. 또, 이걸 에이전트에 녹여낼 수 있도록, 이를 고도화 시키자.



로그 에러 원인 파악하기

```text
(research-agent) sgh_3591@GHGalaxyBook5Pro:~/research-agent$ python ~/research-agent/blockchain_agent.py "RWA 시장 구조를 분석해줘. 스테이블코인 제외 전체 시장 규모, 자산군별 구성 비중, 레포 계약이 시장에서 차지하는 의미, 분산형 vs 표현형 자산의 차이와 시사점을 한국어 리서치 리포트 형식으로 작성해줘."
2026-04-12 19:34:44.462 | WARNING  | roma_dspy.tools.terminal.tmux_session:<module>:18 - libtmux not installed. TmuxSession will not be available.
2026-04-12 19:34:45.056 | INFO     | roma_dspy.core.predictors.code_act_patch:apply_code_act_patch:96 - Applied CodeAct patch to inject typing imports into interpreter
2026-04-12 19:34:49.351 | DEBUG    | roma_dspy.tools.base.base:log_debug:318 - [DefiLlamaToolkit] Registered tool: get_protocol_detail (with metrics tracking)
2026-04-12 19:34:49.351 | DEBUG    | roma_dspy.tools.base.base:log_debug:318 - [DefiLlamaToolkit] Registered tool: get_chain_fees (with metrics tracking)
2026-04-12 19:34:49.351 | DEBUG    | roma_dspy.tools.base.base:log_debug:318 - [DefiLlamaToolkit] Registered tool: get_protocol_fees (with metrics tracking)
2026-04-12 19:34:49.351 | DEBUG    | roma_dspy.tools.base.base:log_debug:318 - [DefiLlamaToolkit] Registered tool: aclose (with metrics tracking)
2026-04-12 19:34:49.351 | DEBUG    | roma_dspy.tools.base.base:log_debug:318 - [DefiLlamaToolkit] Registered tool: get_protocols (with metrics tracking)
2026-04-12 19:34:49.351 | DEBUG    | roma_dspy.tools.base.base:log_debug:318 - [DefiLlamaToolkit] Registered tool: get_protocol_tvl (with metrics tracking)
2026-04-12 19:34:49.351 | DEBUG    | roma_dspy.tools.base.base:log_debug:318 - [DefiLlamaToolkit] Registered tool: get_chains (with metrics tracking)
2026-04-12 19:34:49.351 | DEBUG    | roma_dspy.tools.base.base:log_debug:318 - [DefiLlamaToolkit] Registered tool: get_chain_historical_tvl (with metrics tracking)
2026-04-12 19:34:49.351 | INFO     | roma_dspy.tools.crypto.defillama.client:__init__:89 - Initialized DefiLlamaAPIClient (Free API)
2026-04-12 19:34:49.351 | INFO     | roma_dspy.tools.crypto.defillama.toolkit:__init__:125 - Initialized DefiLlamaToolkit with default chain 'ethereum', Pro features: False, Analysis: True
2026-04-12 19:34:49.351 | DEBUG    | roma_dspy.tools.base.base:log_debug:318 - [CoinGeckoToolkit] Registered tool: get_coin_price (with metrics tracking)
2026-04-12 19:34:49.351 | DEBUG    | roma_dspy.tools.base.base:log_debug:318 - [CoinGeckoToolkit] Registered tool: get_global_crypto_data (with metrics tracking)
2026-04-12 19:34:49.351 | DEBUG    | roma_dspy.tools.base.base:log_debug:318 - [CoinGeckoToolkit] Registered tool: get_multiple_coins_data (with metrics tracking)
2026-04-12 19:34:49.351 | DEBUG    | roma_dspy.tools.base.base:log_debug:318 - [CoinGeckoToolkit] Registered tool: get_coin_market_chart (with metrics tracking)
2026-04-12 19:34:49.351 | DEBUG    | roma_dspy.tools.base.base:log_debug:318 - [CoinGeckoToolkit] Registered tool: get_coin_info (with metrics tracking)
2026-04-12 19:34:49.351 | DEBUG    | roma_dspy.tools.base.base:log_debug:318 - [CoinGeckoToolkit] Registered tool: get_coin_ohlc (with metrics tracking)
2026-04-12 19:34:49.352 | DEBUG    | roma_dspy.tools.base.base:log_debug:318 - [CoinGeckoToolkit] Registered tool: aclose (with metrics tracking)
2026-04-12 19:34:49.352 | DEBUG    | roma_dspy.tools.base.base:log_debug:318 - [CoinGeckoToolkit] Registered tool: get_token_price_by_contract (with metrics tracking)
2026-04-12 19:34:49.352 | DEBUG    | roma_dspy.tools.base.base:log_debug:318 - [CoinGeckoToolkit] Registered tool: search_coins_exchanges_categories (with metrics tracking)
2026-04-12 19:34:49.352 | DEBUG    | roma_dspy.tools.base.base:log_debug:318 - [CoinGeckoToolkit] Registered tool: get_coins_markets (with metrics tracking)
2026-04-12 19:34:49.353 | DEBUG    | roma_dspy.tools.base.base:log_debug:318 - [CoinGeckoToolkit] Registered tool: get_historical_price (with metrics tracking)
2026-04-12 19:34:49.353 | INFO     | roma_dspy.tools.crypto.coingecko.client:__init__:88 - Initialized CoinGeckoAPIClient (Public API)
2026-04-12 19:34:49.353 | INFO     | roma_dspy.tools.crypto.coingecko.toolkit:__init__:92 - Initialized CoinGeckoToolkit with all coins (analysis=disabled)
2026-04-12 19:34:49.353 | DEBUG    | roma_dspy.tools.base.base:log_debug:318 - [BinanceToolkit] Registered tool: get_recent_trades (with metrics tracking)
2026-04-12 19:34:49.353 | DEBUG    | roma_dspy.tools.base.base:log_debug:318 - [BinanceToolkit] Registered tool: get_ticker (with metrics tracking)
2026-04-12 19:34:49.353 | DEBUG    | roma_dspy.tools.base.base:log_debug:318 - [BinanceToolkit] Registered tool: get_ticker_stats (with metrics tracking)
2026-04-12 19:34:49.353 | DEBUG    | roma_dspy.tools.base.base:log_debug:318 - [BinanceToolkit] Registered tool: get_order_book (with metrics tracking)
2026-04-12 19:34:49.353 | DEBUG    | roma_dspy.tools.base.base:log_debug:318 - [BinanceToolkit] Registered tool: get_exchange_info (with metrics tracking)
2026-04-12 19:34:49.353 | DEBUG    | roma_dspy.tools.base.base:log_debug:318 - [BinanceToolkit] Registered tool: get_book_ticker (with metrics tracking)
2026-04-12 19:34:49.353 | DEBUG    | roma_dspy.tools.base.base:log_debug:318 - [BinanceToolkit] Registered tool: aclose (with metrics tracking)
2026-04-12 19:34:49.353 | DEBUG    | roma_dspy.tools.base.base:log_debug:318 - [BinanceToolkit] Registered tool: get_klines (with metrics tracking)
2026-04-12 19:34:49.353 | DEBUG    | roma_dspy.tools.base.base:log_debug:318 - [BinanceToolkit] Registered tool: get_server_time (with metrics tracking)
2026-04-12 19:34:49.354 | DEBUG    | roma_dspy.tools.base.base:log_debug:318 - [BinanceToolkit] Registered tool: get_current_price (with metrics tracking)
2026-04-12 19:34:49.354 | INFO     | roma_dspy.tools.crypto.binance.toolkit:__init__:88 - Initialized BinanceToolkit for spot market with all symbols (analysis=disabled)
2026-04-12 19:34:49.355 | DEBUG    | roma_dspy.core.modules.base_module:_init_from_parameters:263 - Legacy mode: Created CHATAdapter with native_function_calling=False
2026-04-12 19:34:49.356 | DEBUG    | roma_dspy.core.modules.base_module:_init_from_parameters:263 - Legacy mode: Created CHATAdapter with native_function_calling=False
2026-04-12 19:34:49.365 | DEBUG    | roma_dspy.core.modules.base_module:_patch_finish_tool:706 - Patched finish tool to accept **kwargs (has_kwargs=True)
2026-04-12 19:34:49.365 | DEBUG    | roma_dspy.core.modules.base_module:_init_from_parameters:263 - Legacy mode: Created CHATAdapter with native_function_calling=False
2026-04-12 19:34:49.382 | DEBUG    | roma_dspy.core.modules.base_module:_patch_finish_tool:706 - Patched finish tool to accept **kwargs (has_kwargs=True)
2026-04-12 19:34:49.382 | DEBUG    | roma_dspy.core.modules.base_module:_init_from_parameters:263 - Legacy mode: Created CHATAdapter with native_function_calling=False
2026-04-12 19:34:49.383 | DEBUG    | roma_dspy.core.modules.base_module:_init_from_parameters:263 - Legacy mode: Created CHATAdapter with native_function_calling=False
2026-04-12 19:34:49.384 | DEBUG    | roma_dspy.core.modules.base_module:_init_from_parameters:263 - Legacy mode: Created CHATAdapter with native_function_calling=False
2026/04/12 19:34:49 WARNING dspy.primitives.module: Calling module.forward(...) on Atomizer directly is discouraged. Please use module(...) instead.
2026-04-12 19:34:49.387 | DEBUG    | roma_dspy.core.modules.base_module:forward:316 - Setting adapter in context: ChatAdapter (native_fc=False)
2026/04/12 19:34:49 WARNING dspy.primitives.module: Calling module.forward(...) on ChainOfThought directly is discouraged. Please use module(...) instead.
2026-04-12 19:34:49.388 | DEBUG    | roma_dspy.core.modules.base_module:forward:339 - DSPy context keys: ['lm', 'adapter'], adapter=ChatAdapter
2026/04/12 19:34:52 WARNING dspy.primitives.module: Calling module.forward(...) on Planner directly is discouraged. Please use module(...) instead.
2026-04-12 19:34:52.939 | DEBUG    | roma_dspy.core.modules.base_module:forward:316 - Setting adapter in context: ChatAdapter (native_fc=False)
2026/04/12 19:34:52 WARNING dspy.primitives.module: Calling module.forward(...) on ChainOfThought directly is discouraged. Please use module(...) instead.
2026-04-12 19:34:52.939 | DEBUG    | roma_dspy.core.modules.base_module:forward:339 - DSPy context keys: ['lm', 'adapter'], adapter=ChatAdapter
2026/04/12 19:34:58 WARNING dspy.primitives.module: Calling module.forward(...) on Executor directly is discouraged. Please use module(...) instead.
2026-04-12 19:34:58.062 | DEBUG    | roma_dspy.core.modules.base_module:forward:316 - Setting adapter in context: ChatAdapter (native_fc=False)
2026/04/12 19:34:58 WARNING dspy.primitives.module: Calling module.forward(...) on ReAct directly is discouraged. Please use module(...) instead.
2026-04-12 19:34:58.062 | DEBUG    | roma_dspy.core.modules.base_module:forward:339 - DSPy context keys: ['lm', 'adapter'], adapter=ChatAdapter
Using Jina Reranker
Using Jina Reranker
Using Jina Reranker
2026/04/12 19:35:47 WARNING dspy.primitives.module: Calling module.forward(...) on Executor directly is discouraged. Please use module(...) instead.
2026-04-12 19:35:47.234 | DEBUG    | roma_dspy.core.modules.base_module:forward:316 - Setting adapter in context: ChatAdapter (native_fc=False)
2026/04/12 19:35:47 WARNING dspy.primitives.module: Calling module.forward(...) on ReAct directly is discouraged. Please use module(...) instead.
2026-04-12 19:35:47.234 | DEBUG    | roma_dspy.core.modules.base_module:forward:339 - DSPy context keys: ['lm', 'adapter'], adapter=ChatAdapter
Using Jina Reranker
Using Jina Reranker
Using Jina Reranker
2026/04/12 19:36:53 WARNING dspy.primitives.module: Calling module.forward(...) on Executor directly is discouraged. Please use module(...) instead.
2026-04-12 19:36:53.126 | DEBUG    | roma_dspy.core.modules.base_module:forward:316 - Setting adapter in context: ChatAdapter (native_fc=False)
2026/04/12 19:36:53 WARNING dspy.primitives.module: Calling module.forward(...) on ReAct directly is discouraged. Please use module(...) instead.
2026-04-12 19:36:53.126 | DEBUG    | roma_dspy.core.modules.base_module:forward:339 - DSPy context keys: ['lm', 'adapter'], adapter=ChatAdapter
Using Jina Reranker
2026-04-12 19:37:00.458 | ERROR    | opendeepsearch.context_building.build_context:build_context:93 - An error occurred while building context: 'SearchResult' object has no attribute 'get'
Traceback (most recent call last):

  File "/home/sgh_3591/research-agent/blockchain_agent.py", line 55, in <module>
    print(run_pipeline(query))
          │            └ 'RWA 시장 구조를 분석해줘. 스테이블코인 제외 전체 시장 규모, 자산군별 구성 비중, 레포 계약이 시장에서 차지하는 의미, 분산형 vs 표현형 자산의 차이와 시사점을 한국어 리서치 리포트 형식으로 작성해줘.'
          └ <function run_pipeline at 0x785c5dba7c40>

  File "/home/sgh_3591/research-agent/blockchain_agent.py", line 38, in run_pipeline
    execution = search_exec.forward(subtask.goal)
                │           │       │       └ '분산형 자산(Native On-chain)과 표현형 자산(Off-chain backed)의 기술적 구현 차이와 법률적/운용적 시사점을 비교 분석한다.'
                │           │       └ SubTask(goal='분산형 자산(Native On-chain)과 표현형 자산(Off-chain backed)의 기술적 구현 차이와 법률적/운용적 시사점을 비교 분석한다.', task_type=<TaskType.THINK...
                │           └ <function BaseModule.forward at 0x785cd69abba0>
                └ _predictor.react = Predict(StringSignature(goal, context, trajectory -> next_thought, next_tool_name, next_tool_args
                      inst...

  File "/home/sgh_3591/research-agent/ROMA/src/roma_dspy/core/modules/base_module.py", line 344, in forward
    return self._execute_predictor(goal, filtered)
           │    │                  │     └ {'tools': {'tool_0': <opendeepsearch.ods_tool.OpenDeepSearchTool object at 0x785d0573a8d0>}}
           │    │                  └ '분산형 자산(Native On-chain)과 표현형 자산(Off-chain backed)의 기술적 구현 차이와 법률적/운용적 시사점을 비교 분석한다.'
           │    └ <function BaseModule._execute_predictor at 0x785cd69d4ae0>
           └ _predictor.react = Predict(StringSignature(goal, context, trajectory -> next_thought, next_tool_name, next_tool_args
                 inst...

  File "/home/sgh_3591/research-agent/ROMA/src/roma_dspy/resilience/decorators.py", line 218, in sync_wrapper
    result = func(*args, **kwargs)
             │     │       └ {}
             │     └ (_predictor.react = Predict(StringSignature(goal, context, trajectory -> next_thought, next_tool_name, next_tool_args
             │           ins...
             └ <function BaseModule._execute_predictor at 0x785cd69d4a40>

  File "/home/sgh_3591/research-agent/ROMA/src/roma_dspy/resilience/decorators.py", line 111, in sync_wrapper
    return func(*args, **kwargs)
           │     │       └ {}
           │     └ (_predictor.react = Predict(StringSignature(goal, context, trajectory -> next_thought, next_tool_name, next_tool_args
           │           ins...
           └ <function BaseModule._execute_predictor at 0x785cd69d4860>

  File "/home/sgh_3591/research-agent/ROMA/src/roma_dspy/core/modules/base_module.py", line 751, in _execute_predictor
    return self._predictor(goal=goal, **filtered)
           │    │               │       └ {'tools': {'tool_0': <opendeepsearch.ods_tool.OpenDeepSearchTool object at 0x785d0573a8d0>}}
           │    │               └ '분산형 자산(Native On-chain)과 표현형 자산(Off-chain backed)의 기술적 구현 차이와 법률적/운용적 시사점을 비교 분석한다.'
           │    └ react = Predict(StringSignature(goal, context, trajectory -> next_thought, next_tool_name, next_tool_args
           │          instructions="E...
           └ _predictor.react = Predict(StringSignature(goal, context, trajectory -> next_thought, next_tool_name, next_tool_args
                 inst...

  File "/home/sgh_3591/miniconda3/envs/research-agent/lib/python3.12/site-packages/dspy/utils/callback.py", line 326, in sync_wrapper
    return fn(instance, *args, **kwargs)
           │  │          │       └ {'goal': '분산형 자산(Native On-chain)과 표현형 자산(Off-chain backed)의 기술적 구현 차이와 법률적/운용적 시사점을 비교 분석한다.', 'tools': {'tool_0': <opendeep...
           │  │          └ ()
           │  └ react = Predict(StringSignature(goal, context, trajectory -> next_thought, next_tool_name, next_tool_args
           │        instructions="E...
           └ <function Module.__call__ at 0x785ce7b8c680>
  File "/home/sgh_3591/miniconda3/envs/research-agent/lib/python3.12/site-packages/dspy/primitives/module.py", line 82, in __call__
    return self.forward(*args, **kwargs)
           │    │        │       └ {'goal': '분산형 자산(Native On-chain)과 표현형 자산(Off-chain backed)의 기술적 구현 차이와 법률적/운용적 시사점을 비교 분석한다.', 'tools': {'tool_0': <opendeep...
           │    │        └ ()
           │    └ <function ReAct.forward at 0x785ce7bb9800>
           └ react = Predict(StringSignature(goal, context, trajectory -> next_thought, next_tool_name, next_tool_args
                 instructions="E...
  File "/home/sgh_3591/miniconda3/envs/research-agent/lib/python3.12/site-packages/dspy/predict/react.py", line 111, in forward
    trajectory[f"observation_{idx}"] = self.tools[pred.next_tool_name](**pred.next_tool_args)
    │                         │        │    │     │                      └ Prediction(
    │                         │        │    │     │                            next_thought='The goal is to compare the technical implementation differences and the legal/operational impli...
    │                         │        │    │     └ Prediction(
    │                         │        │    │           next_thought='The goal is to compare the technical implementation differences and the legal/operational impli...
    │                         │        │    └ {'OpenDeepSearchTool': Tool(name=OpenDeepSearchTool, desc=None, args={'args': {}, 'sanitize_inputs_outputs': {'type': 'boolea...
    │                         │        └ react = Predict(StringSignature(goal, context, trajectory -> next_thought, next_tool_name, next_tool_args
    │                         │              instructions="E...
    │                         └ 0
    └ {'thought_0': 'The goal is to compare the technical implementation differences and the legal/operational implications between...
  File "/home/sgh_3591/miniconda3/envs/research-agent/lib/python3.12/site-packages/dspy/utils/callback.py", line 326, in sync_wrapper
    return fn(instance, *args, **kwargs)
           │  │          │       └ {'query': '"Native On-chain" "Off-chain backed" 자산 토큰화 기술적 법률적 차이'}
           │  │          └ ()
           │  └ Tool(name=OpenDeepSearchTool, desc=None, args={'args': {}, 'sanitize_inputs_outputs': {'type': 'boolean', 'default': False}, ...
           └ <function Tool.__call__ at 0x785cfe276200>
  File "/home/sgh_3591/miniconda3/envs/research-agent/lib/python3.12/site-packages/dspy/adapters/types/tool.py", line 179, in __call__
    result = self.func(**parsed_kwargs)
             │    │      └ {'query': '"Native On-chain" "Off-chain backed" 자산 토큰화 기술적 법률적 차이'}
             │    └ <opendeepsearch.ods_tool.OpenDeepSearchTool object at 0x785d0573a8d0>
             └ Tool(name=OpenDeepSearchTool, desc=None, args={'args': {}, 'sanitize_inputs_outputs': {'type': 'boolean', 'default': False}, ...
  File "/home/sgh_3591/miniconda3/envs/research-agent/lib/python3.12/site-packages/smolagents/tools.py", line 246, in __call__
    outputs = self.forward(*args, **kwargs)
              │    │        │       └ {'query': '"Native On-chain" "Off-chain backed" 자산 토큰화 기술적 법률적 차이'}
              │    │        └ ()
              │    └ <function OpenDeepSearchTool.forward at 0x785c5dba60c0>
              └ <opendeepsearch.ods_tool.OpenDeepSearchTool object at 0x785d0573a8d0>

  File "/home/sgh_3591/research-agent/OpenDeepSearch/src/opendeepsearch/ods_tool.py", line 35, in forward
    answer = self.search_tool.ask_sync(query, max_sources=2, pro_mode=True)
             │    │           │        └ '"Native On-chain" "Off-chain backed" 자산 토큰화 기술적 법률적 차이'
             │    │           └ <function OpenDeepSearchAgent.ask_sync at 0x785c5dba5ee0>
             │    └ <opendeepsearch.ods_agent.OpenDeepSearchAgent object at 0x785c5d6ff410>
             └ <opendeepsearch.ods_tool.OpenDeepSearchTool object at 0x785d0573a8d0>

  File "/home/sgh_3591/research-agent/OpenDeepSearch/src/opendeepsearch/ods_agent.py", line 179, in ask_sync
    return loop.run_until_complete(self.ask(query, max_sources, pro_mode))
           │    │                  │    │   │      │            └ True
           │    │                  │    │   │      └ 2
           │    │                  │    │   └ '"Native On-chain" "Off-chain backed" 자산 토큰화 기술적 법률적 차이'
           │    │                  │    └ <function OpenDeepSearchAgent.ask at 0x785c5dba5e40>
           │    │                  └ <opendeepsearch.ods_agent.OpenDeepSearchAgent object at 0x785c5d6ff410>
           │    └ <function BaseEventLoop.run_until_complete at 0x785d04516840>
           └ <_UnixSelectorEventLoop running=True closed=False debug=False>

  File "/home/sgh_3591/miniconda3/envs/research-agent/lib/python3.12/asyncio/base_events.py", line 678, in run_until_complete
    self.run_forever()
    │    └ <function BaseEventLoop.run_forever at 0x785d045167a0>
    └ <_UnixSelectorEventLoop running=True closed=False debug=False>
  File "/home/sgh_3591/miniconda3/envs/research-agent/lib/python3.12/asyncio/base_events.py", line 645, in run_forever
    self._run_once()
    │    └ <function BaseEventLoop._run_once at 0x785d045185e0>
    └ <_UnixSelectorEventLoop running=True closed=False debug=False>
  File "/home/sgh_3591/miniconda3/envs/research-agent/lib/python3.12/asyncio/base_events.py", line 1999, in _run_once
    handle._run()
    │      └ <function Handle._run at 0x785d04e6c4a0>
    └ <Handle <_asyncio.TaskStepMethWrapper object at 0x785c5dc4f010>()>
  File "/home/sgh_3591/miniconda3/envs/research-agent/lib/python3.12/asyncio/events.py", line 88, in _run
    self._context.run(self._callback, *self._args)
    │    │            │    │           │    └ <member '_args' of 'Handle' objects>
    │    │            │    │           └ <Handle <_asyncio.TaskStepMethWrapper object at 0x785c5dc4f010>()>
    │    │            │    └ <member '_callback' of 'Handle' objects>
    │    │            └ <Handle <_asyncio.TaskStepMethWrapper object at 0x785c5dc4f010>()>
    │    └ <member '_context' of 'Handle' objects>
    └ <Handle <_asyncio.TaskStepMethWrapper object at 0x785c5dc4f010>()>

  File "/home/sgh_3591/research-agent/OpenDeepSearch/src/opendeepsearch/ods_agent.py", line 143, in ask
    context = await self.search_and_build_context(query, max_sources, pro_mode)
                    │    │                        │      │            └ True
                    │    │                        │      └ 2
                    │    │                        └ '"Native On-chain" "Off-chain backed" 자산 토큰화 기술적 법률적 차이'
                    │    └ <function OpenDeepSearchAgent.search_and_build_context at 0x785c5dba5da0>
                    └ <opendeepsearch.ods_agent.OpenDeepSearchAgent object at 0x785c5d6ff410>

  File "/home/sgh_3591/research-agent/OpenDeepSearch/src/opendeepsearch/ods_agent.py", line 118, in search_and_build_context
    return build_context(processed_sources)
           │             └ <opendeepsearch.serp_search.serp_search.SearchResult object at 0x785c5d6fed80>
           └ <function build_context at 0x785c5ddebec0>

> File "/home/sgh_3591/research-agent/OpenDeepSearch/src/opendeepsearch/context_building/build_context.py", line 63, in build_context
    organic_results = extract_information(sources_result.get('organic', []))
                      │                   └ <opendeepsearch.serp_search.serp_search.SearchResult object at 0x785c5d6fed80>
                      └ <function extract_information at 0x785c5ddebce0>

AttributeError: 'SearchResult' object has no attribute 'get'
Using Jina Reranker
2026/04/12 19:38:00 WARNING dspy.primitives.module: Calling module.forward(...) on Executor directly is discouraged. Please use module(...) instead.
2026-04-12 19:38:00.318 | DEBUG    | roma_dspy.core.modules.base_module:forward:316 - Setting adapter in context: ChatAdapter (native_fc=False)
2026/04/12 19:38:00 WARNING dspy.primitives.module: Calling module.forward(...) on ReAct directly is discouraged. Please use module(...) instead.
2026-04-12 19:38:00.319 | DEBUG    | roma_dspy.core.modules.base_module:forward:339 - DSPy context keys: ['lm', 'adapter'], adapter=ChatAdapter
Using Jina Reranker
2026/04/12 19:38:46 WARNING dspy.primitives.module: Calling module.forward(...) on Aggregator directly is discouraged. Please use module(...) instead.
2026/04/12 19:38:46 WARNING dspy.primitives.module: Calling module.forward(...) on ChainOfThought directly is discouraged. Please use module(...) instead.
2026/04/12 19:39:11 WARNING dspy.primitives.module: Calling module.forward(...) on Verifier directly is discouraged. Please use module(...) instead.
2026/04/12 19:39:11 WARNING dspy.primitives.module: Calling module.forward(...) on ChainOfThought directly is discouraged. Please use module(...) instead.
```

-------------------------

당장 할 수 있는 것

2. 서브태스크 라우팅 개선
지금 키워드 매칭으로 Search/Market Exec 나누는데 ("price", "tvl" 등) 이게 좀 fragile해. LLM한테 판단 맡기는 방식으로 바꾸면 더 정확하게 라우팅 돼.
3. 한국어 시스템 프롬프트 추가
지금 쿼리는 한국어로 넣는데 내부 프롬프트는 영어야. 한국어로 리포트 출력하도록 명시적으로 지정하면 더 일관된 결과 나와.

나중에 할 것
4. 병렬 실행
지금 서브태스크를 순서대로 실행하는데, ROMA가 병렬 실행 지원해. 적용하면 속도 2~3배 빨라져.
5. CryptoAnalystBench로 성능 평가
Sentient가 만든 198개 쿼리 벤치마크. 지금 에이전트 실제 성능 수치로 측정 가능해.
구조적 개선
6. 멀티턴 대화 지원
지금은 쿼리 하나 → 결과 하나로 끝나. 결과 보고 "이 부분 더 깊게 파줘" 같은 후속 질문 이어가는 구조로 만들 수 있어.
7. 리포트 저장 자동화
지금은 터미널에 출력만 해. 결과를 자동으로 마크다운 파일로 저장하면 블로그 포스팅이나 팀 공유에 바로 쓸 수 있어.
8. 쿼리 인터페이스
지금은 blockchain_agent.py 파일 열어서 마지막 줄 수정해야 해. 커맨드라인에서 python blockchain_agent.py "쿼리" 로 바로 넣을 수 있게 하면 훨씬 편해.

데이터 소스 확장
9. Coinglass 툴킷 추가
펀딩레이트, 미결제약정, 청산 데이터 가져올 수 있어. 파생상품 분석할 때 필수야. API 키 필요하긴 한데 무료 플랜 있어.
10. Arkham 추가
아까 미뤄둔 거. 온체인 지갑 추적, 대형 홀더 분석할 때 필요해.
11. MCP로 외부 데이터 연결
ROMA MCPToolkit 쓰면 GitHub, Notion, 슬랙 같은 외부 서비스도 연결 가능해. 예를 들어 BlueNode 노션 문서를 컨텍스트로 넣을 수 있어.

고도화
12. DSPy 최적화 (옵티마이저)
DSPy의 MIPROv2 같은 옵티마이저 돌리면 프롬프트를 자동으로 최적화해줘. 같은 비용에 퀄리티가 올라가.
13. CryptoAnalystBench 벤치마크
198개 쿼리로 지금 에이전트 성능을 수치로 측정하고, 개선 전후 비교할 수 있어.





![crypto_agent 세팅](/assets/img/crypto-agent-setup.png)
![crypto_agent 세팅완료?](/assets/img/crypto-agent-setup-complete.png)
내가 전에 만들었던 에이전트가 아니라 ROMA 기본 에이전트를 사용하는 것으로 결정.
거기에 기본모델말고, 내가 원하는 모델들로 교체


KelpDAO의 취약한 단일 검증 구조에서 시작된 보안 결함이, 디파이 생태계의 높은 상호 연결성을 타고 담보 자산의 가치를 붕괴시키며 Aave를 중심으로 연쇄적인 금융 리스크 전이를 초래한 사건입니다.


전에 직접 실행 vs 지금 Docker API
전에 (blockchain_agent.py):
기호 터미널 → Python 직접 실행 → ROMA 라이브러리 호출

로컬 Python 환경에서 직접 실행
우리가 짠 코드가 바로 돌아가
config 파일 안 씀, 코드에서 직접 모델 지정

지금 (Docker API):
기호 터미널 → HTTP 요청 → Docker 컨테이너 안의 API 서버 → ROMA 실행

Docker 컨테이너 안에서 실행
crypto_agent.yaml config 읽어서 실행
컨테이너 안의 ROMA 코드 버전이 로컬이랑 다를 수 있어


오류가 너무 많이나서 다 날리고 다시 시작.

우리 에이전트 뭐 이런거 말고, 그냥 ROMA에서 내가 정한 모델 쓰고, 구조는 뒤에 바꾸는 걸로

```bash
# conda 환경 생성 (Python 3.14.4)
conda create -n research-agent python=3.14.4 -y
conda activate research-agent

# 작업 폴더 생성
mkdir ~/research-agent
cd ~/research-agent
```

```bash
# uv 설치
pip install uv

# ROMA 클론 및 설치
git clone https://github.com/sentient-agi/ROMA.git
cd ROMA
uv pip install -e .

# 설치 확인
python -c "from roma_dspy.core.engine.solve import solve; print('ROMA OK')"
```

just setup crypto_agent
했고, 
오픈라우터랑 serper api키 설정함


는 다시 처음부터 시작함
왜? 깃허브 때문에 - 깃허브에 연결시켜놓고 쓰려고


(research-agent) sgh_3591@GHGalaxyBook5Pro:~/research-agent/ROMA$ ./cli solve "What is Bitcoin's current market cap?" --profile crypto_agent
2026-05-02 15:38:04.067 | INFO     | roma_dspy.core.predictors.code_act_patch:apply_code_act_patch:96 - Applied CodeAct patch to inject typing imports into interpreter
2026-05-02 15:38:04.178 | DEBUG    | roma_dspy.config.manager:load_config:74 - Loading config: path=None, profile=crypto_agent, overrides=None, env_prefix=ROMA_
2026-05-02 15:38:04.178 | DEBUG    | roma_dspy.config.manager:load_config:83 - Initialized empty base config (defaults applied in validation)
2026-05-02 15:38:04.209 | DEBUG    | roma_dspy.config.manager:_load_yaml:149 - Loaded and cached config from config/defaults/config.yaml
2026-05-02 15:38:04.216 | DEBUG    | roma_dspy.config.manager:load_config:100 - Merged default config from config/defaults/config.yaml
2026-05-02 15:38:04.310 | DEBUG    | roma_dspy.config.manager:_load_yaml:149 - Loaded and cached config from config/profiles/crypto_agent.yaml
2026-05-02 15:38:04.367 | DEBUG    | roma_dspy.config.manager:load_config:107 - Applied profile: crypto_agent
2026-05-02 15:38:04.394 | DEBUG    | roma_dspy.config.manager:load_config:123 - Resolved interpolations
2026-05-02 15:38:04.399 | DEBUG    | roma_dspy.tools.base.manager:_register_toolkit_class:136 - Registered toolkit: ArtifactToolkit
2026-05-02 15:38:04.399 | DEBUG    | roma_dspy.tools.base.manager:_register_toolkit_class:136 - Registered toolkit: FileToolkit
2026-05-02 15:38:04.399 | DEBUG    | roma_dspy.tools.base.manager:_register_toolkit_class:136 - Registered toolkit: CalculatorToolkit
2026-05-02 15:38:04.399 | DEBUG    | roma_dspy.tools.base.manager:_register_toolkit_class:136 - Registered toolkit: TerminalToolkit
2026-05-02 15:38:04.399 | DEBUG    | roma_dspy.tools.base.manager:_register_toolkit_class:136 - Registered toolkit: SubprocessTerminalToolkit
2026-05-02 15:38:04.400 | DEBUG    | roma_dspy.tools.base.manager:_register_toolkit_class:136 - Registered toolkit: SerperToolkit
2026-05-02 15:38:04.400 | DEBUG    | roma_dspy.tools.base.manager:_register_toolkit_class:136 - Registered toolkit: WebSearchToolkit
2026-05-02 15:38:04.401 | DEBUG    | roma_dspy.tools.base.manager:_register_toolkit_class:136 - Registered toolkit: E2BToolkit
2026-05-02 15:38:04.401 | DEBUG    | roma_dspy.tools.base.manager:_register_toolkit_class:136 - Registered toolkit: BinanceToolkit
2026-05-02 15:38:04.401 | DEBUG    | roma_dspy.tools.base.manager:_register_toolkit_class:136 - Registered toolkit: CoinGeckoToolkit
2026-05-02 15:38:04.401 | DEBUG    | roma_dspy.tools.base.manager:_register_toolkit_class:136 - Registered toolkit: DefiLlamaToolkit
2026-05-02 15:38:04.402 | DEBUG    | roma_dspy.tools.base.manager:_register_toolkit_class:136 - Registered toolkit: ArkhamToolkit
2026-05-02 15:38:04.402 | DEBUG    | roma_dspy.tools.base.manager:_register_toolkit_class:136 - Registered toolkit: CoinglassToolkit
2026-05-02 15:38:06.659 | DEBUG    | roma_dspy.tools.base.manager:_register_toolkit_class:136 - Registered toolkit: MCPToolkit
2026-05-02 15:38:06.668 | INFO     | roma_dspy.config.manager:load_config:130 - Configuration loaded and validated successfully
2026-05-02 15:38:06.745 | INFO     | roma_dspy.core.utils.demo_loader:_load_python:133 | none             | none     | Loaded 6 demos from prompt_optimization.prompts.seed_prompts.atomizer_seed:ATOMIZER_DEMOS
2026-05-02 15:38:06.746 | INFO     | roma_dspy.core.modules.base_module:_init_from_config:144 | none             | none     | [LM Config] Atomizer: model=openrouter/google/gemini-3-flash-preview, timeout=600s, max_tokens=1000
2026-05-02 15:38:06.748 | INFO     | roma_dspy.core.factory.agent_factory:create_agent:104 | none             | none     | Created atomizer agent (task_type=default, signature=default, demos=6)
2026-05-02 15:38:06.751 | INFO     | roma_dspy.core.utils.demo_loader:_load_python:133 | none             | none     | Loaded 4 demos from prompt_optimization.prompts.seed_prompts.planner_seed:PLANNER_DEMOS
2026-05-02 15:38:06.752 | INFO     | roma_dspy.core.modules.base_module:_init_from_config:144 | none             | none     | [LM Config] Planner: model=openrouter/openai/gpt-5.4-mini, timeout=600s, max_tokens=4000
2026-05-02 15:38:06.755 | INFO     | roma_dspy.core.factory.agent_factory:create_agent:104 | none             | none     | Created planner agent (task_type=default, signature=default, demos=4)
2026-05-02 15:38:06.763 | INFO     | roma_dspy.core.utils.demo_loader:_load_python:133 | none             | none     | Loaded 12 demos from prompt_optimization.prompts.seed_prompts.executor_retrieve_seed:EXECUTOR_RETRIEVE_DEMOS
2026-05-02 15:38:06.763 | INFO     | roma_dspy.core.modules.base_module:_init_from_config:144 | none             | none     | [LM Config] Executor: model=openrouter/google/gemini-3-flash-preview, timeout=600s, max_tokens=30000
2026-05-02 15:38:06.764 | INFO     | roma_dspy.core.factory.agent_factory:create_agent:104 | none             | none     | Created executor agent (task_type=RETRIEVE, signature=default, demos=12)
2026-05-02 15:38:06.767 | INFO     | roma_dspy.core.utils.demo_loader:_load_python:133 | none             | none     | Loaded 6 demos from prompt_optimization.prompts.seed_prompts.executor_code_seed:EXECUTOR_CODE_DEMOS
2026-05-02 15:38:06.767 | INFO     | roma_dspy.core.modules.base_module:_init_from_config:144 | none             | none     | [LM Config] Executor: model=openrouter/openai/gpt-5.3-codex, timeout=600s, max_tokens=30000
2026-05-02 15:38:06.768 | INFO     | roma_dspy.core.factory.agent_factory:create_agent:104 | none             | none     | Created executor agent (task_type=CODE_INTERPRET, signature=default, demos=6)
2026-05-02 15:38:06.771 | INFO     | roma_dspy.core.utils.demo_loader:_load_python:133 | none             | none     | Loaded 6 demos from prompt_optimization.prompts.seed_prompts.executor_think_seed:EXECUTOR_THINK_DEMOS
2026-05-02 15:38:06.772 | INFO     | roma_dspy.core.modules.base_module:_init_from_config:144 | none             | none     | [LM Config] Executor: model=openrouter/google/gemini-3.1-pro-preview, timeout=600s, max_tokens=30000
2026-05-02 15:38:06.772 | INFO     | roma_dspy.core.factory.agent_factory:create_agent:104 | none             | none     | Created executor agent (task_type=THINK, signature=default, demos=6)
2026-05-02 15:38:06.781 | INFO     | roma_dspy.core.utils.demo_loader:_load_python:133 | none             | none     | Loaded 6 demos from prompt_optimization.prompts.seed_prompts.executor_write_seed:EXECUTOR_WRITE_DEMOS
2026-05-02 15:38:06.782 | INFO     | roma_dspy.core.modules.base_module:_init_from_config:144 | none             | none     | [LM Config] Executor: model=openrouter/google/gemini-3.1-pro-preview, timeout=600s, max_tokens=16000
2026-05-02 15:38:06.782 | INFO     | roma_dspy.core.factory.agent_factory:create_agent:104 | none             | none     | Created executor agent (task_type=WRITE, signature=default, demos=6)
2026-05-02 15:38:06.785 | INFO     | roma_dspy.core.utils.demo_loader:_load_python:133 | none             | none     | Loaded 4 demos from prompt_optimization.prompts.seed_prompts.executor_seed:EXECUTOR_DEMOS
2026-05-02 15:38:06.786 | INFO     | roma_dspy.core.modules.base_module:_init_from_config:144 | none             | none     | [LM Config] Executor: model=openrouter/anthropic/claude-sonnet-4-6, timeout=600s, max_tokens=30000
2026-05-02 15:38:06.787 | INFO     | roma_dspy.core.factory.agent_factory:create_agent:104 | none             | none     | Created executor agent (task_type=default, signature=default, demos=4)
2026-05-02 15:38:06.788 | INFO     | roma_dspy.core.utils.demo_loader:_load_python:133 | none             | none     | Loaded 0 demos from prompt_optimization.prompts.seed_prompts.aggregator_seed:AGGREGATOR_DEMOS
2026-05-02 15:38:06.788 | INFO     | roma_dspy.core.modules.base_module:_init_from_config:144 | none             | none     | [LM Config] Aggregator: model=openrouter/google/gemini-3.1-pro-preview, timeout=600s, max_tokens=5000
2026-05-02 15:38:06.791 | INFO     | roma_dspy.core.factory.agent_factory:create_agent:104 | none             | none     | Created aggregator agent (task_type=default, signature=default, demos=0)
2026-05-02 15:38:06.792 | INFO     | roma_dspy.core.utils.demo_loader:_load_python:133 | none             | none     | Loaded 11 demos from prompt_optimization.prompts.seed_prompts.verifier_seed:VERIFIER_DEMOS
2026-05-02 15:38:06.792 | INFO     | roma_dspy.core.modules.base_module:_init_from_config:144 | none             | none     | [LM Config] Verifier: model=openrouter/google/gemini-3.1-pro-preview, timeout=600s, max_tokens=3000
2026-05-02 15:38:06.794 | INFO     | roma_dspy.core.factory.agent_factory:create_agent:104 | none             | none     | Created verifier agent (task_type=default, signature=default, demos=11)
2026-05-02 15:38:06.794 | INFO     | roma_dspy.core.registry.agent_registry:initialize_from_config:112 | none             | none     | Initialized registry with 9 agents. Task-specific: 4, Defaults: 5
2026-05-02 15:38:08.056 | INFO     | roma_dspy.core.engine.solve:__init__:98 | none             | none     | PostgreSQL persistence enabled
2026-05-02 15:38:08.290 | INFO     | roma_dspy.core.engine.solve:_configure_dspy_cache:355 | none             | none     | DSPy cache configured: disk=True, memory=True, dir=.cache/dspy
2026-05-02 15:38:08.322 | WARNING  | roma_dspy.core.storage.file_storage:__init__:115 | none             | none     | Could not create storage root /opt/sentient/executions/70ab41e4-2636-4d37-b48f-cdf88b24cdff: [Errno 13] Permission denied: '/opt/sentient/executions'. Assuming it exists and is accessible.
2026-05-02 15:38:08.324 | WARNING  | roma_dspy.core.storage.file_storage:__init__:135 | none             | none     | Could not create subdirectory /opt/sentient/executions/70ab41e4-2636-4d37-b48f-cdf88b24cdff/artifacts: [Errno 13] Permission denied: '/opt/sentient/executions'
2026-05-02 15:38:08.326 | WARNING  | roma_dspy.core.storage.file_storage:__init__:135 | none             | none     | Could not create subdirectory /opt/sentient/executions/70ab41e4-2636-4d37-b48f-cdf88b24cdff/temp: [Errno 13] Permission denied: '/opt/sentient/executions'
2026-05-02 15:38:08.327 | WARNING  | roma_dspy.core.storage.file_storage:__init__:135 | none             | none     | Could not create subdirectory /opt/sentient/executions/70ab41e4-2636-4d37-b48f-cdf88b24cdff/results: [Errno 13] Permission denied: '/opt/sentient/executions'
2026-05-02 15:38:08.327 | WARNING  | roma_dspy.core.storage.file_storage:__init__:135 | none             | none     | Could not create subdirectory /opt/sentient/executions/70ab41e4-2636-4d37-b48f-cdf88b24cdff/results/plots: [Errno 13] Permission denied: '/opt/sentient/executions'
2026-05-02 15:38:08.330 | WARNING  | roma_dspy.core.storage.file_storage:__init__:135 | none             | none     | Could not create subdirectory /opt/sentient/executions/70ab41e4-2636-4d37-b48f-cdf88b24cdff/results/reports: [Errno 13] Permission denied: '/opt/sentient/executions'
2026-05-02 15:38:08.331 | WARNING  | roma_dspy.core.storage.file_storage:__init__:135 | none             | none     | Could not create subdirectory /opt/sentient/executions/70ab41e4-2636-4d37-b48f-cdf88b24cdff/outputs: [Errno 13] Permission denied: '/opt/sentient/executions'
2026-05-02 15:38:08.333 | WARNING  | roma_dspy.core.storage.file_storage:__init__:135 | none             | none     | Could not create subdirectory /opt/sentient/executions/70ab41e4-2636-4d37-b48f-cdf88b24cdff/logs: [Errno 13] Permission denied: '/opt/sentient/executions'
2026-05-02 15:38:08.333 | INFO     | roma_dspy.core.storage.file_storage:__init__:139 | none             | none     | Initialized FileStorage for execution: 70ab41e4-2636-4d37-b48f-cdf88b24cdff at /opt/sentient/executions/70ab41e4-2636-4d37-b48f-cdf88b24cdff (flat=False)
⠙ Solving task...2026-05-02 15:38:08.529 | INFO     | roma_dspy.core.storage.postgres_storage:initialize:177 | none             | none     | PostgresStorage initialized in thread 126944486136704 with event loop 126943589612480
2026-05-02 15:38:08.529 | INFO     | roma_dspy.core.observability.execution_manager:_initialize_postgres:169 | none             | none     | ✓ PostgreSQL storage initialized successfully
⠹ Solving task...2026-05-02 15:38:08.607 | INFO     | roma_dspy.resilience.checkpoint_manager:create_checkpoint:80 | none             | none     | Creating checkpoint checkpoint_20260502_153808_607498_57c49e44 triggered by execution_start
2026-05-02 15:38:08.637 | INFO     | roma_dspy.resilience.checkpoint_manager:create_checkpoint:131 | none             | none     | Checkpoint checkpoint_20260502_153808_607498_57c49e44 created successfully
2026-05-02 15:38:08.637 | INFO     | roma_dspy.resilience.checkpoint_manager:start_periodic_checkpoints:421 | none             | none     | Starting periodic checkpoints every 30.0s (after 10.0s warmup)
⠹ Solving task...2026-05-02 15:38:11.019 | INFO     | roma_dspy.resilience.decorators:async_wrapper:308 | none             | none     | ModuleRuntime._async_execute_module async completed | duration=2.38s
⠹ Solving task...2026-05-02 15:38:11.787 | INFO     | roma_dspy.tools.base.manager:get_tools_for_execution:656 | none             | none     | [CACHE CREATE] Created and cached E2BToolkit | cache_key=70ab41e4-2636-4d37-b48f-cdf88b24cdff:E2BToolkit:46bb44d791f974de | cache_size=1
2026-05-02 15:38:11.788 | INFO     | roma_dspy.tools.web_search.toolkit:__init__:226 | none             | none     | Initialized WebSearchToolkit: model=openrouter/openai/gpt-5.4-mini, provider=openrouter, engine=exa, max_results=5
2026-05-02 15:38:11.789 | INFO     | roma_dspy.tools.base.manager:get_tools_for_execution:656 | none             | none     | [CACHE CREATE] Created and cached WebSearchToolkit | cache_key=70ab41e4-2636-4d37-b48f-cdf88b24cdff:WebSearchToolkit:2e8bf4448ddfe325 | cache_size=2
⠴ Solving task...2026-05-02 15:38:13.681 | INFO     | mcp.client.streamable_http:_maybe_extract_session_id_from_response:181 | none             | none     | Received session ID: cebb4906235a7579af6bc5714a18f85b9b7e9e7a2a954e584d0e20f5f14e50e9
2026-05-02 15:38:13.696 | INFO     | mcp.client.streamable_http:_maybe_extract_protocol_version_from_message:193 | none             | none     | Negotiated protocol version: 2025-11-25
⠹ Solving task...2026-05-02 15:38:14.205 | INFO     | mcp.client.streamable_http:handle_get_stream:298 | none             | none     | GET stream disconnected, reconnecting in 1000ms...
⠇ Solving task...2026-05-02 15:38:14.734 | INFO     | roma_dspy.tools.mcp.toolkit:initialize:456 | none             | none     | Initialized MCP server 'coingecko_mcp' with storage (threshold: 10KB) (2 tools)
2026-05-02 15:38:14.735 | INFO     | roma_dspy.tools.base.manager:get_tools_for_execution:642 | none             | none     | Async toolkit initialized: MCPToolkit | tools_discovered=2 | init_time=2945.4ms
2026-05-02 15:38:14.736 | INFO     | roma_dspy.tools.base.manager:get_tools_for_execution:656 | none             | none     | [CACHE CREATE] Created and cached MCPToolkit | cache_key=70ab41e4-2636-4d37-b48f-cdf88b24cdff:MCPToolkit:1f61bba7ed7fc874 | cache_size=3
2026-05-02 15:38:14.737 | INFO     | roma_dspy.tools.crypto.binance.toolkit:__init__:88 | none             | none     | Initialized BinanceToolkit for spot market with all symbols (analysis=enabled)
2026-05-02 15:38:14.737 | INFO     | roma_dspy.tools.base.manager:get_tools_for_execution:656 | none             | none     | [CACHE CREATE] Created and cached BinanceToolkit | cache_key=70ab41e4-2636-4d37-b48f-cdf88b24cdff:BinanceToolkit:df8455eabafc7af6 | cache_size=4
2026-05-02 15:38:14.738 | INFO     | roma_dspy.tools.crypto.defillama.client:__init__:89 | none             | none     | Initialized DefiLlamaAPIClient (Pro API)
2026-05-02 15:38:14.738 | INFO     | roma_dspy.tools.crypto.defillama.toolkit:__init__:125 | none             | none     | Initialized DefiLlamaToolkit with default chain 'ethereum', Pro features: True, Analysis: True
2026-05-02 15:38:14.738 | INFO     | roma_dspy.tools.base.manager:get_tools_for_execution:656 | none             | none     | [CACHE CREATE] Created and cached DefiLlamaToolkit | cache_key=70ab41e4-2636-4d37-b48f-cdf88b24cdff:DefiLlamaToolkit:78e31e279bc4e2f7 | cache_size=5
2026-05-02 15:38:14.739 | INFO     | roma_dspy.tools.crypto.arkham.toolkit:__init__:89 | none             | none     | Initialized ArkhamToolkit with default chain 'ethereum', Analysis: True
2026-05-02 15:38:14.740 | INFO     | roma_dspy.tools.base.manager:get_tools_for_execution:656 | none             | none     | [CACHE CREATE] Created and cached ArkhamToolkit | cache_key=70ab41e4-2636-4d37-b48f-cdf88b24cdff:ArkhamToolkit:b49a7e040b2f73dd | cache_size=6
2026-05-02 15:38:14.740 | INFO     | roma_dspy.tools.crypto.coinglass.client:__init__:72 | none             | none     | Initialized CoinglassAPIClient
2026-05-02 15:38:14.741 | INFO     | roma_dspy.tools.crypto.coinglass.toolkit:__init__:86 | none             | none     | Initialized CoinglassToolkit with 3 symbols (default: BTC)
2026-05-02 15:38:14.741 | INFO     | roma_dspy.tools.base.manager:get_tools_for_execution:656 | none             | none     | [CACHE CREATE] Created and cached CoinglassToolkit | cache_key=70ab41e4-2636-4d37-b48f-cdf88b24cdff:CoinglassToolkit:a87981852e6743c0 | cache_size=7
2026-05-02 15:38:14.743 | ERROR    | roma_dspy.tools.base.base:log_error:322 | none             | none     | [FileToolkit] Failed to initialize toolkit FileToolkit: [Errno 13] Permission denied: '/opt/sentient/executions'
2026-05-02 15:38:14.745 | ERROR    | roma_dspy.tools.base.manager:_create_toolkit_instance:787 | none             | none     | Failed to create FileToolkit instance: [Errno 13] Permission denied: '/opt/sentient/executions'
2026-05-02 15:38:14.745 | ERROR    | roma_dspy.tools.base.manager:get_tools_for_execution:673 | none             | none     | Failed to create FileToolkit for 70ab41e4-2636-4d37-b48f-cdf88b24cdff: [Errno 13] Permission denied: '/opt/sentient/executions'
2026-05-02 15:38:14.745 | INFO     | roma_dspy.tools.base.manager:get_tools_for_execution:713 | none             | none     | Toolkit cache stats for 70ab41e4-2636-4d37-b48f-cdf88b24cdff: created=7, reused=0, hit_rate=0.0%, total_tools=48
2026-05-02 15:38:14.749 | ERROR    | roma_dspy.tools.base.base:log_error:322 | none             | none     | [ArtifactToolkit] Failed to initialize toolkit ArtifactToolkit: [Errno 13] Permission denied: '/opt/sentient/executions'
2026-05-02 15:38:14.750 | ERROR    | roma_dspy.tools.base.manager:_create_toolkit_instance:787 | none             | none     | Failed to create ArtifactToolkit instance: [Errno 13] Permission denied: '/opt/sentient/executions'
2026-05-02 15:38:14.751 | ERROR    | roma_dspy.tools.base.manager:get_tools_for_execution:673 | none             | none     | Failed to create ArtifactToolkit for 70ab41e4-2636-4d37-b48f-cdf88b24cdff: [Errno 13] Permission denied: '/opt/sentient/executions'
⠋ Solving task...2026-05-02 15:38:14.754 | ERROR    | roma_dspy.tools.base.base:log_error:322 | none             | none     | [FileToolkit] Failed to initialize toolkit FileToolkit: [Errno 13] Permission denied: '/opt/sentient/executions'
2026-05-02 15:38:14.754 | ERROR    | roma_dspy.tools.base.manager:_create_toolkit_instance:787 | none             | none     | Failed to create FileToolkit instance: [Errno 13] Permission denied: '/opt/sentient/executions'
2026-05-02 15:38:14.755 | ERROR    | roma_dspy.tools.base.manager:get_tools_for_execution:673 | none             | none     | Failed to create FileToolkit for 70ab41e4-2636-4d37-b48f-cdf88b24cdff: [Errno 13] Permission denied: '/opt/sentient/executions'
2026-05-02 15:38:14.755 | INFO     | roma_dspy.tools.base.manager:get_tools_for_execution:713 | none             | none     | Toolkit cache stats for 70ab41e4-2636-4d37-b48f-cdf88b24cdff: created=0, reused=7, hit_rate=77.8%, total_tools=48
⠹ Solving task...2026-05-02 15:38:47.081 | INFO     | roma_dspy.resilience.checkpoint_manager:create_checkpoint:80 | none             | none     | Creating checkpoint checkpoint_20260502_153847_081725_27ce2939 triggered by periodic
2026-05-02 15:38:47.118 | INFO     | roma_dspy.resilience.checkpoint_manager:create_checkpoint:131 | none             | none     | Checkpoint checkpoint_20260502_153847_081725_27ce2939 created successfully
⠙ Solving task...2026-05-02 15:39:04.597 | INFO     | roma_dspy.resilience.decorators:async_wrapper:308 | none             | none     | ModuleRuntime._async_execute_module async completed | duration=49.85s
⠹ Solving task...2026-05-02 15:39:04.641 | INFO     | roma_dspy.resilience.checkpoint_manager:create_checkpoint:80 | none             | none     | Creating checkpoint checkpoint_20260502_153904_641776_a0ac2b82 triggered by execution_complete
2026-05-02 15:39:04.672 | INFO     | roma_dspy.resilience.checkpoint_manager:create_checkpoint:131 | none             | none     | Checkpoint checkpoint_20260502_153904_641776_a0ac2b82 created successfully
⠸ Solving task...2026-05-02 15:39:04.708 | INFO     | roma_dspy.resilience.checkpoint_manager:stop_periodic_checkpoints:433 | none             | none     | Stopping periodic checkpoints
⠋ Solving task...2026-05-02 15:39:05.297 | WARNING  | mcp.client.streamable_http:terminate_session:591 | none             | none     | Session termination failed: 404
⠏ Solving task...2026-05-02 15:39:05.300 | INFO     | roma_dspy.tools.mcp.toolkit:cleanup:863 | none             | none     | Disconnected from MCP server: coingecko_mcp
2026-05-02 15:39:05.301 | INFO     | roma_dspy.tools.base.manager:cleanup_execution:954 | none             | none     | Cleaned up execution 70ab41e4-2636-4d37-b48f-cdf88b24cdff: removed=7, retained=0 (cache size: 0)
2026-05-02 15:39:06.001 | INFO     | roma_dspy.tools.metrics.decorators:async_wrapper:153 | 70ab41e4-2636-4d37-b48f-cdf88b24cdff | none     | Toolkit cleanup completed
⠹ Solving task...2026-05-02 15:39:06.302 | INFO     | roma_dspy.core.context.execution_context:persist_metrics:352 | 70ab41e4-2636-4d37-b48f-cdf88b24cdff | none     | Persisted observability data for 70ab41e4-2636-4d37-b48f-cdf88b24cdff

╭────────────────────────────────────────────────────── Result ───────────────────────────────────────────────────────╮
│ **Executive Summary**                                                                                               │
│ As of May 2, 2026, Bitcoin's current market capitalization is approximately $1.55 Trillion to $1.57 Trillion. This  │
│ valuation is driven by a real-time trading price of roughly $78,000 and a circulating supply of just over 20        │
│ million coins.                                                                                                      │
│                                                                                                                     │
│ **Context**                                                                                                         │
│ Market capitalization is a fundamental metric used to evaluate a cryptocurrency's total network value, calculated   │
│ by multiplying the current asset price by its total circulating supply. Given Bitcoin's 24/7 global trading         │
│ environment, this figure fluctuates continuously based on market demand, macroeconomic factors, and liquidity.      │
│                                                                                                                     │
│ **Analysis: Market Capitalization Data**                                                                            │
│ A cross-reference of major digital asset data providers reveals a consensus market capitalization in the mid-$1.5   │
│ Trillion range, though minor variances exist due to differing price aggregation algorithms:                         │
│ - **High-End Estimate:** (https://www.coingecko.com/en/coins/bitcoin) reports a market cap of $1,567,695,436,914    │
│ (~$1.57 Trillion). This is based on a live price of $78,293.73 and a circulating supply of 20,023,521 BTC.          │
│ - **Mid-Range Estimate:** (https://studio.glassnode.com/charts/market.MarketcapUsd?a=BTC) reports a near-real-time  │
│ network value of $1,549,352,532,988 (~$1.55 Trillion).                                                              │
│ - **Lagging Indicator Nuance:** Other trackers like (https://coincodex.com/bitcoin-market-cap/) and                 │
│ (https://www.statmuse.com/money/ask/market-cap-of-bitcoin) cite calculations nearing $1.33 Trillion. This reflects  │
│ data captured during a localized price dip to ~$66,000, illustrating how rapidly the figure moves in response to    │
│ short-term market volatility.                                                                                       │
│                                                                                                                     │
│ **Evidence & Key Metrics**                                                                                          │
│ - **Current Price:** ~$78,293 USD                                                                                   │
│ - **Circulating Supply:** ~20.02 million BTC (out of a 21 million hard cap)                                         │
│ - **Market Dominance:** Bitcoin represents ~58% of the total cryptocurrency market capitalization, underscoring its │
│ continued status as the market bellwether.                                                                          │
│                                                                                                                     │
│ **Implications**                                                                                                    │
│ Remaining securely above the $1.5 Trillion threshold cements Bitcoin's position as one of the world's most valuable │
│ assets. At this market capitalization, Bitcoin rivals the overall market value of global mega-cap technology        │
│ companies and major global commodities like silver. This sustained trillion-dollar status bolsters the "digital     │
│ gold" narrative, justifying the continuous influx of institutional capital, algorithmic ETF inflows, and            │
│ nation-state or corporate treasury adoptions.                                                                       │
│                                                                                                                     │
│ **Limitations**                                                                                                     │
│ Because Bitcoin trades continuously without market closures, stating an absolute market capitalization is only      │
│ accurate down to the minute. A standard 5% daily swing in Bitcoin's price equates to an absolute market cap change  │
│ of nearly $80 Billion. Furthermore, slight differences in how API providers calculate circulating supply (such as   │
│ how they handle ostensibly "lost" coins or Satoshi's untouched genesis wallets) can lead to billions of dollars in  │
│ nominal calculation variance between platforms.                                                                     │
╰─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯
(research-agent) sgh_3591@GHGalaxyBook5Pro:~/research-agent/ROMA$


![just viz 실행](/assets/img/just-viz-execution.png)

tui 로 들어가기


실행 분석 결과
Execution ID: d19fddb1-01ba-4a80-a0bd-a69a1f4f60a2 총 실행 시간: ~22분 (08:56:20 → 09:18:46 UTC)

등록된 에이전트 (9개)
#	Agent	Model	Strategy	Toolkits
1
Atomizer
Gemini 3 Flash Preview
ChainOfThought
없음
2
Planner
GPT-5.4 mini
ChainOfThought
WebSearchToolkit
3
Executor (RETRIEVE)
Gemini 3 Flash Preview
ReAct
WebSearch, Binance, DefiLlama, Arkham, Coinglass, Artifact (35 tools)
4
Executor (CODE)
GPT-5.3 Codex
ReAct
E2B + 기타
5
Executor (THINK)
Gemini 3.1 Pro Preview
ReAct
WebSearch, ODS, DefiLlama, Arkham, Coinglass, Artifact (30 tools)
6
Executor (WRITE)
Gemini 3.1 Pro Preview
ChainOfThought
Artifact만
7
Executor (default)
Claude Sonnet 4.6
ReAct
8개 전체
8
Aggregator
Gemini 3.1 Pro Preview
ChainOfThought
Artifact
9
Verifier
Claude Sonnet 4.6
ChainOfThought
없음
실행 흐름
[08:56:25] Atomizer (Gemini Flash) → 루트 태스크 분해 (2.5s)
    ↓
[08:56:27] Planner (GPT-5.4 mini + WebSearch) → 서브태스크 계획
    ↓
[08:56:28~] 병렬 실행 시작
    ├── RETRIEVE (Gemini Flash) × 여러 서브태스크
    ├── THINK (Gemini 3.1 Pro + ODS) × 여러 서브태스크  
    └── WRITE (Gemini 3.1 Pro) × 작성 태스크
    ↓
[08:59:59] 1차 Aggregator (Gemini 3.1 Pro) → 155초 소요 (가장 긴 단일 호출)
    ↓
[09:00:04~] 2차 재귀적 분해 + 실행 (깊이 2~4)
    ├── 추가 RETRIEVE 태스크들
    ├── 추가 THINK 태스크들 (ODSToolkit 활발 사용)
    └── 추가 Aggregator 라운드들
    ↓
[09:12:05~] 최종 THINK 라운드 (ODS + WebSearch + DefiLlama...)
    ↓
[09:18:28] 최종 Aggregation → Verifier (Claude Sonnet 4.6)
    ↓
[09:18:46] 실행 완료 ✓
주요 발견
ODSToolkit (deep_search) 정상 작동 확인 - THINK 태스크에서 ODSToolkit create 로그 확인. RETRIEVE에서 분리한 뒤 ValueError: 'deep_search' is not one of ('finish',) 에러가 한 번도 안 나왔다.

사용된 툴킷 전체 목록:

WebSearchToolkit (Planner + RETRIEVE + THINK)
ODSToolkit (THINK only - 이관 성공)
DefiLlamaToolkit (RETRIEVE + THINK)
ArkhamToolkit (RETRIEVE + THINK)
BinanceToolkit (RETRIEVE + THINK)
CoinglassToolkit (RETRIEVE + THINK)
ArtifactToolkit (전 에이전트 공통)
Aggregator가 가장 오래 걸림 - 155초(약 2.5분)짜리 호출이 하나 있었다. 여러 서브태스크 결과를 종합하느라 큰 토큰 소모.

MLflow UniqueViolation - 기존과 동일하게 발생했지만, 실행에는 영향 없음 (옵저버빌리티 노이즈).

태스크 수 - 50개 이상의 서브태스크가 execution_start → execution_complete 기록됨. 재귀 깊이(max_depth=4)까지 활용한 심층 분석.

최종 결과 (5개 주장형 리서치 주제)
결과가 로그 마지막에 잘 나왔어:

프로토콜 모듈러 보안의 체계적 리스크 - 1-of-1 DVN 설정이 전체 DeFi 시스템 위험을 증폭
LRT 파생 자산 오라클의 구조적 맹점 - rsETH/ETH 비율만 의존하는 오라클이 $142M 부실채권 방지 실패
하이퍼 금융화된 결합성의 전염 파괴력 - Looping + Pendle 등 결합성이 폭발적 시스템 리스크 확산
오프체인 인프라(RPC) 의존성의 온체인 무결성 파괴 - 스마트 컨트랙트 보안과 무관하게 RPC 포이즈닝이 전체 체인 무결성 훼손
프로토콜 간 구제 금융 의존과 거버넌스 도덕적 해이 - Aave Safety Module로 외부 프로토콜 실패를 흡수하는 구조적 문제
네가 설계한 파이프라인이 정확히 작동했어: Atomizer → Planner → [RETRIEVE | THINK | WRITE] → Aggregator → Verifier, ODS가 THINK에서 deep_search 정상 호출하고, Verifier(Claude Sonnet 4.6)까지 돌아서 완성됐다!


![](/assets/img/posts/image-motusko2.png)


![](/assets/img/posts/image-motuszef.png)

![](/assets/img/posts/image-motut7e4.png)

$2.2 ~ $2.5 22분 정도 돌았고, 가격이 이정도면 꽤 비싼 것 같은데, 주장형 에이전트로 만들면서, 비용까지 고려해야겠다.
