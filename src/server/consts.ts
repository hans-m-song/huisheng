export enum Status {
  Ok = 200,
  BadRequest = 400,
  Error = 503,
}

export enum Header {
  ContentType = 'Content-Type',
  HXRequest = 'HX-Request',
}

export enum ContentType {
  JSON = 'application/json; charset=utf-8',
  HTML = 'text/html; charset=utf-8',
  Form = 'application/x-www-form-urlencoded; charset=utf-8',
}
