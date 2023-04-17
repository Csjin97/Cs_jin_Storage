#include <stdio.h>
//gcc prime.c
//./a.out
// 뺄셈
int get_gcd(int u, int v){
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
///////// 개선된 알고리즘//////////
// 나머지 연산
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
////////////////////////////////////
void main(void){
    int u, v;
    puts("\n EUCLID1 : Get gcd of two positive integer \n  Input 0 to end program");
    while(1){
        puts("\n\n Iput two positive integer ->");
        scanf("%d %d",&u ,&v);
        if(u <0 || v < 0){
            continue;
        }
        if(u == 0 || v == 0){
            break;
        }
        printf("\n GCD OF %d and %d is %d.", u, v, get_gcd(u,v));
        printf("\n 개선_1 %d and %d is %d.", 280, 30, gcd_modulus(280, 30));
        printf("\n gcd_modulus()의 재귀적 표현 %d and %d is %d.", 280, 30, gcd_recursion(280, 30));
    }
}

