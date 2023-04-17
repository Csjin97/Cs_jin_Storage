#include <stdio.h>
#include <math.h>
//gcc prime.c -lm
//./a.out
// -lm 은 math.h 참조 
#include "timer.h"

//성능 비교
#define TRUE 1

// 소수 판별
int is_prime1(int n){
    int i;
    for(i = 2; i < n; i++){
        if(n % i == 0){
            return !TRUE;
        }
    return TRUE;
    }
}

// 소수 판별2 실수형
int is_prime2(int n){
    int i, sqrn;
    sqrn = (int)sqrt(n);
    for(i = 2; i <= sqrn; i++){
        if(n % i == 0){
            return !TRUE;
        }
    return TRUE;
    }
}

void result(int i, int n, int r, long t){
    printf("\n Prime%d Ans : %d is %s prime number in %ld time.", i, n ,r ? "" : "not", t);
}

#define LOOP 1000

void main(void){
    int n;
    int r;
    int i;
    clock_t t1 ,t2;

    puts("\n PRIME2 : Prime algorithm speed test. \n input 0 to end program.");

    while(TRUE){
        puts("\nInput number to test ->");
        scanf("%d", &n);
        if(n < 0){
            continue;
        }
        if(n == 0){
            break;
        }

        t1 = clock();
            for(i = 0; i < LOOP; i++){
                r = is_prime1(n);
            }
        t2 = clock();
        result(1, n, r, diff_clock(t1, t2));

        t1 = clock();
            for(i = 0; i < LOOP; i++){
                r = is_prime2(n);
            }
        t2 = clock();
        result(2, n, r, diff_clock(t1, t2));
    }
    
}