---
title: "블록체인 개념 공부: 스마트 컨트랙트란?"
date: 2026-03-13
categories: [Blockchain, Study]
tags: [블록체인, 스마트컨트랙트, Solidity, 개념정리]
---

## 스마트 컨트랙트 개요

이 카테고리에는 블록체인 기초 개념부터 심화 내용까지 공부한 내용을 기록합니다.

## 스마트 컨트랙트란?

> "자동으로 실행되는 계약 코드"

스마트 컨트랙트는 블록체인 위에 배포되어, 사전에 정의된 조건이 충족될 때 자동으로 실행되는 코드입니다.

### 특징
- **불변성(Immutability)**: 배포 후 코드 수정 불가
- **투명성(Transparency)**: 모든 실행 내역이 블록체인에 기록
- **자동 실행(Automation)**: 중간자 없이 조건 충족 시 자동 실행

### 간단한 Solidity 예시

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SimpleStorage {
    uint256 private storedValue;

    function set(uint256 value) public {
        storedValue = value;
    }

    function get() public view returns (uint256) {
        return storedValue;
    }
}
```

## 참고 자료

- [Solidity 공식 문서](https://docs.soliditylang.org)
- [Cyfrin Updraft](https://updraft.cyfrin.io)
