#include <stdio.h>

int sigma(int n){
    int r;
    for(r = 0 n > 0; n--){
        r += n;
    }
    return r;
}

void main(void){
    int a;
    printf("\n Input number -> ");
    scanf("%d",&a);
    prinf("\n Sigma 1 to %d.", a, sigma(a));
}

void swap(int a, int b){
    int t;
    t = *a;
    *a = *b;
    *b = t;
}

void main(void){
    int x= 10, y = 20;
    swap(&x, &y);
    // x, y 주소값을 복사 
}