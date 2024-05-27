export enum Status {
  Ok = 200,
  BadRequest = 400,
  Error = 503,
}

export enum Header {
  ContentType = 'Content-Type',
  HXRequest = 'HX-Request',
  HXTrigger = 'HX-Trigger',
}

export enum ContentType {
  JSON = 'application/json; charset=utf-8',
  HTML = 'text/html; charset=utf-8',
  Form = 'application/x-www-form-urlencoded; charset=utf-8',
}

export enum Trigger {
  Songs = 'app:songs',
  PendingSongs = 'app:songs:pending',
  Queue = 'app:queue',
}
