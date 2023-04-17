#ifndef _TIMER_H
#define _TIMER_H

#include <time.h>

#define diff_clock(t1, t2) (double)((t2)-(t1))
#define diff_second(t1, t2) ((double)((t2)-(t1)) / CLOCKS_PER_SEC)

#endif