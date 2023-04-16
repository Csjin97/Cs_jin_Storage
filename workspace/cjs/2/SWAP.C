#include <stdio.h>
#include <alloc.h>
#include <mem.h>

void swap (void *a, void *b, int n){
    void *t;
    t = malloc(n);
    memcpy(t, a, n); /* 임시 영역 t에 n만킁의 공간 확보 */
    memcpy(a, b, n); /* t = a */
    memcpy(b, t, n); /*b = t */
    free(t);
}

void main(void){
    char c1 = 'A', c2 = 'B';
    int i1 = 100, i2 = 200;
    float f1 = 3.14, f2 = 2.71;

    printf("\n Before : %c %c ", c1, c2);
    swap(&c1, &c2, sizeof(char));
    printf("\t After : %c %c ", c1, c2);

    printf("\n Before : %d %d ", i1 ,i2);
    swap(&i1, &i2, sezeof(int));
    printf("\t After : %d %d ", i1, i2);

    printf("\n Before : %f %f ", f1, f2);
    swap(&f1, &f2, sizeof(float));
    printf("\t After : %f %f", f1, f2);
    
}