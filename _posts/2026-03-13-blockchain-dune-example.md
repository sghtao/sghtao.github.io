---
title: "Dune Analytics: 첫 번째 대시보드 만들기"
date: 2026-03-13
categories: [Blockchain, Dune]
tags: [Dune, Analytics, SQL, 온체인데이터]
---

## Dune Analytics란?

Dune Analytics는 블록체인 온체인 데이터를 SQL로 쿼리하고 시각화할 수 있는 플랫폼입니다.
이 카테고리에는 제가 작성한 Dune 대시보드와 분석 내용을 기록합니다.

## 대시보드 구성 예시

### 분석 주제
> 특정 프로토콜의 TVL(Total Value Locked) 추이 분석

### 사용한 테이블
- `ethereum.transactions`
- `uniswap_v3_ethereum.Pool_evt_Swap`

### 핵심 쿼리 예시

```sql
SELECT
  date_trunc('day', block_time) AS day,
  COUNT(*) AS tx_count,
  SUM(value / 1e18) AS eth_volume
FROM ethereum.transactions
WHERE block_time >= NOW() - INTERVAL '30' day
GROUP BY 1
ORDER BY 1
```

## 대시보드 링크

- [Dune 대시보드 링크 추가 예정](#)
