import { Controller, Sse } from "@nestjs/common";
import { Observable, map } from "rxjs";
import { EventsService, AppEvent } from "./events.service";

@Controller("events")
export class EventsController {
  constructor(private readonly events: EventsService) {}

  @Sse()
  stream(): Observable<MessageEvent> {
    return this.events.stream().pipe(
      map((event: any) => ({
        data: event.data as AppEvent,
      })),
    );
  }
}
