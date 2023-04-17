#include <stdio.h>
#include <time.h>
#include "timer.h"

//성능 비교
/*뺄셈을 이용한 방법*/
int gcd_minus(int u, int v){
    int t; 

    while (u){
        if(u < v){
            t = u;
            u = v;
            v = t;
        }
        u = u - v;
    }
    return v;
}

// 나머지 연산을 이용한 방법

int gcd_modulus(int u, int v){
    int t;

    while(v){
        t = u % v;
        u = v;
        v = t;
    }
    return u;
}

// 재귀호출

int gcd_recursion(int u, int v){
    if(v == 0){
        return u;
    }
    else{
        return gcd_recursion(v, u % v);
    }
}

# define LOOP 10000

void main(void){
    int u, v, gcd;
    clock_t t1 ,t2;
    int i;
    double duration;

    puts("\n EUCLD2 : Get gcd with time cheking \n Input 0 to end program");

    while(1){
        puts("\n\n Input two positive integer -> ");
        scanf("%d %d", &u, &v);

        if(u < 0 || v < 0){
            continue;
        }
        if(u == 0 || v == 0){
            break;
        }

        t1 = clock();
            for (i = 0; i < LOOP; i++){
                gcd = gcd_minus(u, v);
            }
        t2 = clock();
        duration = diff_clock(t1,t2);
        printf(" \n Minus methods : GCD OF %d and %d is %d. in %lf time", u, v, gcd, duration);

        t1 = clock();
            for (i = 0; i < LOOP; i++){
                gcd = gcd_modulus(u, v);
            }
        t2 = clock();
        duration = diff_clock(t1, t2);
        printf(" \n Modulus methods : GCD OF %d and %d is %d. in %lf time", u, v, gcd, duration);

        t1 = clock();
            for (i = 0; i < LOOP; i++){
                gcd = gcd_recursion(u, v);
            }
        t2 = clock();
        duration = diff_clock(t1, t2);
        printf(" \n recursion methods : GCD OF %d and %d is %d. in %lf time", u, v, gcd, duration);
    }
}