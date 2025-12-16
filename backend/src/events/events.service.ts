import { Injectable } from "@nestjs/common";
import { Observable, Subject } from "rxjs";

export type AppEvent =
  | { type: "bolao.updated"; bolaoId: string }
  | { type: "bolao.deleted"; bolaoId: string }
  | { type: "draw.created"; bolaoId: string; drawId: string }
  | { type: "prize.updated"; bolaoId: string }
  | { type: "pot.updated"; bolaoId?: string }
  | { type: "bet.created"; bolaoId: string }
  | { type: "ping" };

@Injectable()
export class EventsService {
  private readonly subject = new Subject<AppEvent>();

  emit(event: AppEvent) {
    this.subject.next(event);
  }

  stream(): Observable<AppEvent> {
    return new Observable((subscriber) => {
      const subscription = this.subject.subscribe((event) => {
        subscriber.next(event);
      });

      return () => subscription.unsubscribe();
    });
  }
}
