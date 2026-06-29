export type AppRole = 'admin' | 'coach' | 'player' | 'parent';
export type Player = { id:number; no:number; name:string; role:string; group:string; status:string };
export type Training = { id:number; group:string; date:string; time:string; location:string; coach:string };
export type Match = { id:number; group:string; opponent:string; date:string; time:string; location:string; status:string; score?:string };
