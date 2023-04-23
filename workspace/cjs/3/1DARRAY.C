#include <stdio.h>

#define MAX 10

int average(int a[], int n){
    int sum = 0;
    int i;

    for(i =0; i < n; i++){
        sum += a[i];
    }
    return (sum/n);
}

int main(void){
    int array[MAX];
    int i;
    printf("\nInput %d integer -> ", MAX);
    for (i = 0; i < MAX; i++)
        scanf("%d", array + i);
    printf("\n Average of %d integer is %d", MAX, average(array, MAX));
}