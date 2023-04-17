#include <stdio.h>
#include <math.h>
#define TRUE 1

// 소수이면 TRUE 아니면 !TRUE
int is_prime(int n){
    int i;

    for(i =2; i < n; i++){
        if(n % i== 0){
            return !TRUE; 
        }
        return TRUE; //소수
    }
}
// 개선된 알고리즘////////////
int is_prime2(int n){
    int i, sqrn;
    sqrn = (int)sqrt(n);
    for(i= 2; i <= sqrn; i++){
        if(n % i == 0){
            return !TRUE;
        }
        return TRUE;
    }
}
/////////////////////////////
void main(void){
    int n;

    puts("\n PRIME1 : Test that input number is prime or not. \n Input 0 to end profram.");

    while(TRUE){
        puts("\n Input number ro test -> ");
        scanf("%d", &n);
        if(n < 0){ //음수 재입력
            continue;
        }
        if(n == 0){ // 0 종료
            break;
        }
        // printf("\n Ans : %d is %s prime number" ,n ,is_prime(n) ? "" : "not");
        printf("\n Ans : %d is %s prime number" ,n ,is_prime2(n) ? "" : "not");
    }
}