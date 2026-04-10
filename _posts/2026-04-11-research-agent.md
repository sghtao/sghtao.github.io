---
title: "Sentient의 ROMA + ODS로 블록체인 리서치 에이전트 구축하기"
date: 2025-04-11 00:00:00 +0900
categories: [Blockchain, AI Agent]
tags: [sentient, roma, ods, ai-agent, blockchain, llm, defi]
description: Sentient의 ROMA 프레임워크와 OpenDeepSearch를 활용한 블록체인 리서치 에이전트 아키텍처 설계 및 세팅 가이드
---

> 이 글은 Sentient AGI의 오픈소스 레포를 직접 분석하며 정리한 내용이다.  
> ROMA README, ODS README를 기반으로 블록체인 리서치 에이전트에 맞게 재구성했다.

---

## 왜 ROMA인가?

AI 에이전트가 단일 쿼리에서는 잘 동작하지만, **긴 태스크에서는 에러가 누적**된다.  
99% 신뢰도의 에이전트도 10단계를 연속으로 실행하면 성공률이 급격히 떨어진다.

ROMA(Recursive Open Meta-Agent)는 이 문제를 **계층적 트리 구조**로 해결한다.  
복잡한 목표를 서브태스크로 재귀 분해하고, 독립적인 서브태스크는 병렬 실행하며, 모든 단계의 입출력을 추적 가능하게 만든다.

SEAL-0 벤치마크에서 ROMA Search가 **45.6% 달성** (Kimi Researcher 36%, Gemini 2.5 Pro 19.8% 대비).

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
# ~/.bashrc에 영구 저장
cat >> ~/.bashrc << 'EOF'

# LLM
export OPENROUTER_API_KEY="sk-or-v1-..."
export ANTHROPIC_API_KEY="sk-ant-..."

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
| [OpenRouter](https://openrouter.ai) | Gemini 모델 통합 관리 | 종량제 |
| [Anthropic](https://console.anthropic.com) | Claude Sonnet (Verifier) | 종량제 |
| [Serper.dev](https://serper.dev) | ODS 웹 검색 | 무료 2500 크레딧 |
| [Jina AI](https://jina.ai) | ODS 리랭커 | 무료 플랜 |
| [CoinGecko](https://www.coingecko.com/api) | 크립토 시세 | 무료 플랜 |

---

## 커스텀 모델 구성 코드

```python
import dspy
from roma_dspy import Atomizer, Planner, Executor, Aggregator, Verifier
from opendeepsearch import OpenDeepSearchTool
from roma_dspy.toolkits import DefiLlamaToolkit, CoinGeckoToolkit, ArkhamToolkit

# ODS 툴 초기화
search_tool = OpenDeepSearchTool(
    model_name="openrouter/google/gemini-3-flash",
    reranker="jina"
)

# Atomizer, Planner — Gemini 3 Flash (IFBench 78%, 152 tok/s)
atomizer = Atomizer(lm=dspy.LM("openrouter/google/gemini-3-flash"))
planner  = Planner(lm=dspy.LM("openrouter/google/gemini-3-flash"))

# Search Exec — Gemini 3.1 Pro (Long Context 73%)
search_exec = Executor(
    lm=dspy.LM("openrouter/google/gemini-3.1-pro"),
    prediction_strategy="react",
    tools=[search_tool]
)

# Market Exec — Gemini 3 Flash (Tool Use 80%)
market_exec = Executor(
    lm=dspy.LM("openrouter/google/gemini-3-flash"),
    prediction_strategy="react",
    tools=[DefiLlamaToolkit(), CoinGeckoToolkit(), ArkhamToolkit()]
)

# Aggregator — Gemini 3.1 Pro (Intelligence 57, AA-LCRL 73%)
aggregator = Aggregator(lm=dspy.LM("openrouter/google/gemini-3.1-pro"))

# Verifier — Claude Sonnet 4.6 (Non-Hallucination 34%)
verifier = Verifier(
    lm=dspy.LM("anthropic/claude-sonnet-4-6", temperature=0.0)
)
```

---

## 실행 환경 구성

| 레이어 | 역할 | 비고 |
|--------|------|------|
| **WSL2 Ubuntu 22.04** | ROMA 실행, 오케스트레이션 | Python 3.12 |
| **OpenRouter** | Gemini 3 Flash / 3.1 Pro | 멀티모델 한 번에 관리 |
| **Anthropic API** | Claude Sonnet 4.6 (Verifier) | 환각 검증 전용 |
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