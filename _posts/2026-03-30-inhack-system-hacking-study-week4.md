---
title: "Mitigation, Stack Canary, NX, ASLR, PIE, RELRO - 시스템 해킹 스터디 4주차"
date: 2026-03-31 00:00:00 +0900
categories: [Security, study]
tags: [security, system-hacking, mitigation, canary, NX, ASLR, PIE, RELRO]
---

 
4주차 내용은 Mitigation(보호 기법)을 다룬다.
 
Stack Canary, NX, ASLR, PIE, RELRO 다섯 가지의 보호 기법을 다루는데, 드림핵과 순서가 조금 다르다. 드림핵에는 이 보호 기법을 다루기 전에 셸코드, 함수 호출 규약, Stack Buffer Overflow를 다루는데, 팀장님은 이걸 건너뛰고 더 뒤에서 다루신다.
 
이렇게 준비하신 이유를 여쭤봤더니, Mitigation은 중요하기도 하고 이번 주에 다루는 내용들이 무조건 디폴트로 깔고 가야 하는 개념들이라 한 번에 진행했다고 하셨다. 또, Stack BOF나 셸코드를 뒤로 미룬 이유는 카나리에 의해 해당 공격이 막힐 수 있으니, 카나리를 우회하는 실습까지 같이 진행하기 위함이라고 하셨다. 보호 기법의 존재를 인지하고 공격과 방어막 뚫기를 한 번에 실습하기 위한 팀장님의 빅 픽쳐다.
 
## Mitigation이란?
 
공격이 성공하기 어렵게 만들거나 공격의 영향력을 줄이는 방어책을 의미한다.
 
```
(base) sgh_3591@GHGalaxyBook5Pro:~$ checksec --file=/bin/ls
RELRO           STACK CANARY      NX            PIE             RPATH      RUNPATH      Symbols         FORTIFY Fortified       Fortifiable     FILE
Full RELRO      Canary found      NX enabled    PIE enabled     No RPATH   No RUNPATH   No Symbols        Yes   6      18               /bin/ls
```
이번에 배울 단어 들이 보인다.
RELRO - Full RELRO
STACK CANARY - Canary found
NX - NX enabled
PIE - PIE enabled

![alt text](assets/img/스크린샷 2026-03-31 001154.png)
 
`checksec` 명령어 결과에서 초록색 텍스트는 해당 보호 기법이 켜져 있고 안전하게 적용되어 있다는 것을 의미한다. 빨간색이 있다면 방어막이 꺼져있거나 적용되지 않아 보안이 취약한 상태다.
 
추가로 `RPATH`, `RUNPATH`, `Symbols`는 이번 주에 다루지 않지만, 해커가 공격할 틈을 주지 않거나 분석을 귀찮게 만드는 위장막이나 자물쇠 정도로 이해하고 넘어가자.
 
## Stack Canary
 
스택 카나리는 함수의 프롤로그에서 스택 버퍼와 반환 주소 사이에 임의의 값을 삽입하고, 함수의 에필로그에서 해당 값의 변조를 확인하는 보호 기법이다. 카나리 값의 변조가 확인되면 프로세스는 강제 종료된다. 즉, 함수의 복귀 주소(Return Address)가 덮어씌워지는 것을 탐지하기 위해, 스택의 로컬 변수와 복귀 주소 사이에 삽입되는 임의의 값(Random Value)이다.
 
![alt text](assets/img/스크린샷 2026-03-31 002418.png)
![alt text](assets/img/스크린샷 2026-03-31 002505.png)
![alt text](assets/img/스크린샷 2026-03-31 003243.png)
buf[8]을 해놓고 32바이트 데이터를 read 하려고 해서 경고를 주는 모습
 
### 카나리 비활성화/활성화 실습
 
Ubuntu 22.04의 gcc는 기본적으로 스택 카나리를 적용하여 바이너리를 컴파일한다. `-fno-stack-protector` 옵션을 추가해야 카나리 없이 컴파일할 수 있다.
 
카나리 비활성화:
 
```bash
gcc -o no_canary canary.c -fno-stack-protector
```
 
```
(base) sgh_3591@GHGalaxyBook5Pro:~/system-hacking-study$ ./no_canary
HHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH
Segmentation fault (core dumped)
```
 
카나리 활성화:
 
```bash
gcc -o canary canary.c
```
 
```
(base) sgh_3591@GHGalaxyBook5Pro:~/system-hacking-study$ ./canary
HHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH
*** stack smashing detected ***: terminated
Aborted (core dumped)
```
 
카나리가 없을 때는 버퍼보다 큰 입력이 들어오면 메모리 구조가 깨져 `Segmentation fault`로 비정상 종료된다. 카나리가 있을 때는 스택 오버플로우를 감지하고 `*** stack smashing detected ***` 메시지와 함께 프로그램을 강제로 안전하게 종료시킨다.
 
버퍼 오버플로우가 지정된 버퍼보다 입력 값이 클 때 생기는 거구나! 재밌다!

**Stack Canary는 Stack Buffer Overflow를 막기 위한 Mitigation이다.**

 
### 어셈블리 레벨에서 카나리 동작 원리
 
`no_canary`와 비교하면 `main` 함수의 프롤로그와 에필로그에 다음 코드들이 추가되어 있다.
 
```nasm
   push   rbp
   mov    rbp,rsp
   sub    rsp,0x10
+  mov    rax,QWORD PTR fs:0x28       ; 원본 카나리 값을 rax로 가져옴
+  mov    QWORD PTR [rbp-0x8],rax     ; 스택 길목에 카나리 묻어두기
+  xor    eax,eax                     ; rax 흔적 지우기
+  lea    rax,[rbp-0x10]
-  lea    rax,[rbp-0x8]
   mov    edx,0x20
   mov    rsi,rax
   mov    edi,0x0
   call   read@plt
   mov    eax,0x0
+  mov    rcx,QWORD PTR [rbp-0x8]    ; 스택에서 카나리 파내기
+  xor    rcx,QWORD PTR fs:0x28      ; 원본과 비교
+  je     0x6f0 <main+70>            ; 같으면 정상 종료
+  call   __stack_chk_fail@plt       ; 다르면 비상벨
   leave
   ret
```
 
두 갈래로 나눌 수 있다.
 
**프롤로그 (함수 시작): 카나리 숨겨두기**
 
`fs:0x28`이라는 특수 구역에 보관된 원본 카나리 값을 `rax`로 가져와 스택의 `[rbp-0x8]` 위치에 묻어둔다. 이 위치가 바로 버퍼와 반환 주소 사이 길목이다. 이후 `xor eax, eax`로 레지스터 흔적을 지워 해커가 카나리 값을 훔쳐보지 못하게 한다.
 
**에필로그 (함수 끝): 카나리 생존 확인**
 
스택에서 카나리 값을 다시 꺼내 원본(`fs:0x28`)과 `xor`로 비교한다. `xor`은 두 값이 완전히 같으면 0을 반환하는 특징이 있다. 같으면(`je`) 정상 종료, 다르면 `__stack_chk_fail`을 호출해 `*** stack smashing detected ***`를 출력하고 프로그램을 즉시 종료한다.
 
컴파일러가 개발자 코드의 앞뒤로 **원본 카나리 복사 → 작업 수행 → 카나리 훼손 여부 대조 → 다르면 프로그램 폭파** 라는 덫을 어셈블리 단위에서 깔아둔 것이다. 아직 완전히 이해가 되지는 않지만 카나리에서 흥미가 확 붙는다!
 
## NX (No-eXecute)
 
실행에 사용되는 메모리 영역과 쓰기에 사용되는 메모리 영역을 분리하는 보호 기법이다. 쓰기 권한과 실행 권한이 같은 메모리 영역에 함께 있으면 시스템이 취약해지기 쉽기 때문에 코드 실행 권한을 제거한다. **NX는 셸코드(Shellcode) 실행 공격을 막기 위한 Mitigation이다.**
 
## ASLR (Address Space Layout Randomization)
 
바이너리가 실행될 때마다 스택, 힙, 공유 라이브러리 등을 임의의 주소에 할당하는 보호 기법이다. 공격자가 특정 함수의 주소를 미리 알고 고정된 주소로 점프하는 것을 방어한다. **ASLR은 메모리 오염(Memory Corruption) 기반 공격을 막기 위한 Mitigation이다.**
 
프로그램이 실행되면 커널이 난수 생성기를 통해 랜덤 값을 뽑고, 스택, 힙, 공유 라이브러리를 계산된 주소에 배치한다. 공격자가 디버깅(`gdb`)을 통해 알아낸 주소가 다음 실행 시에는 완전히 다른 곳으로 바뀌어 있어 공격 코드가 작동하지 않는다.
 
## PIE (Position-Independent Executable)
 
ASLR이 실행 파일이 매핑된 영역에도 적용되게 해주는 기술이다. **PIE는 코드 영역(Code/Text Segment)을 타겟으로 하는 공격을 막기 위한 Mitigation이다.**
 
ASLR만 적용되고 PIE가 없으면, 스택·힙·라이브러리 주소는 매 실행마다 바뀌지만 메인 프로그램(Code 영역)의 주소는 고정된다. 공격자는 고정된 프로그램 주소 내 가젯을 이용해 공격을 이어갈 수 있다. ASLR과 PIE가 모두 적용되면 프로그램 자체 주소도 실행할 때마다 바뀌어, 공격자는 단 하나의 주소도 확신할 수 없는 상태가 된다.
 
PIE는 보안성 향상을 위해 도입된 것이라 엄밀히 말하면 보호 기법은 아니고, ASLR이 코드 영역에도 적용되게 해주는 기술이다.
 
## RELRO (RELocation Read-Only)
 
프로그램이 사용하는 외부 함수의 실제 주소를 저장하는 메모리 영역인 GOT(Global Offset Table)를 읽기 전용(Read-Only)으로 설정하는 보안 기법이다. **RELRO는 GOT Overwrite 공격을 막기 위한 Mitigation이다.** 부분적으로 적용하는 Partial RELRO와 가장 넓은 영역에 적용하는 Full RELRO가 있다.
 
---
 
카나리 실습이 너무 재미있어서 다른 Mitigation도 실습해보고 싶었는데, 시간이 도저히 나지 않을 것 같다. 그치만 너무 재밌다.
 
오프라인 스터디 시간이 맞지 않아 혼자 공부하는 와중에, 보안 공부를 처음 하는 지라 장벽이 조금 느껴지고 어렵게 느껴지는 부분이 상당수였다. 특히 3주차 내용이 그랬다. 포기할까 하는 마음도 있었지만, 이번 학기는 완주해내겠다는 나와의 약속을 지키고자 4주차 내용을 공부해보았는데, 보안 공부가 생각보다도 더 재밌는 것 같다.
 
터미널에서 무언가가 이루어지는 게 투박하고 직관적이지는 않지만, 시각적으로 잘 눈에 들어오지 않던 내용들이 작동 원리를 조금 이해하자 하나 둘씩 눈에 들어오는 게 신기하고 재미있다.
 
보안 공부, 이렇게 rough하게라도 계속 이어나가보자. 생각보다 재밌다. 실습이 있으니까 더 좋은 것 같다!