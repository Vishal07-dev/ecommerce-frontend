import { Signal } from "@angular/core"
import { toObservable, toSignal } from "@angular/core/rxjs-interop"
import { debounceTime } from "rxjs"

export function debouncingSignal <T>(
    signal:Signal<T>,
    debouncedelay:number,
    initialValue:T
){

    const singnalobs = toObservable(signal)

    return toSignal(singnalobs.pipe(debounceTime(debouncedelay)),{
        initialValue
    })

}