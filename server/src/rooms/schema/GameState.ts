import { Schema, type, MapSchema, ArraySchema } from "@colyseus/schema";

export class Enemy extends Schema {
  @type("string") id: string = "";
  @type("string") name: string = "";
  @type("string") type: string = "";
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  @type("number") hp: number = 100;
  @type("number") level: number = 1;
}

export class Player extends Schema {
  @type("string") id: string = "";
  @type("string") name: string = "Agent";
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  @type("number") hp: number = 100;
  @type("number") ram: number = 100;
  @type("number") level: number = 1;
  @type("string") color: string = "0xffffff";
  @type(["string"]) inventory = new ArraySchema<string>();
}

export class GameState extends Schema {
  @type({ map: Player }) players = new MapSchema<Player>();
  @type({ map: Enemy }) enemies = new MapSchema<Enemy>();
}
