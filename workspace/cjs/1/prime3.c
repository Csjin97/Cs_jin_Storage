#include <stdio.h>
// #include <alloc.h>
#include <stdlib.h>

#define MAX 9999

void main(void){
    int* iptr;
    int i, j;

    iptr = (int*)calloc(MAX, sizeof(int)); //메모리 할당과 초기화
    if(iptr == NULL){
        //할당 실패
        puts("\n Menory allocation error ! ");
        exit(1);
    }

    for(i = 2; i < MAX; i++){
        if(iptr[i] == 1){
            continue;
        }
        j = i;
        while((j += i) <= MAX){
            iptr[j] = 1;
            
        }
        
    }
    for(i = 2; i <= MAX; i++){
        if(iptr[i] == 0)
            printf("/t %6d", i);
    }
}