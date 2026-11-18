export class RoomAdapter {
  async createRoom(){throw new Error("RoomAdapter.createRoom must be implemented by a transport adapter.");}
  async joinRoom(){throw new Error("RoomAdapter.joinRoom must be implemented by a transport adapter.");}
  async sendAction(){throw new Error("RoomAdapter.sendAction must be implemented by a transport adapter.");}
  subscribe(){throw new Error("RoomAdapter.subscribe must be implemented by a transport adapter.");}
  async leaveRoom(){throw new Error("RoomAdapter.leaveRoom must be implemented by a transport adapter.");}
}
export class LocalRoomAdapter extends RoomAdapter {
  constructor(options){
    super();this.capacity=(options&&options.capacity)||2;this.rooms=new Map();this.listeners=new Map();
  }
  async createRoom({gameId,hostId,metadata={}}){
    const id="local-"+Math.random().toString(36).slice(2,10);
    const room={id,gameId,metadata,createdAt:Date.now(),seats:[{id:hostId,kind:"human",ready:true}],status:"waiting",version:1};
    this.rooms.set(id,room);return structuredClone(room);
  }
  async joinRoom({roomId,playerId,kind="human"}){
    const room=this.rooms.get(roomId);if(!room)throw new Error("Room not found.");
    if(room.seats.length>=this.capacity)throw new Error("Room is full.");
    if(room.seats.some(s=>s.id===playerId))throw new Error("Player already joined.");
    room.seats.push({id:playerId,kind,ready:false});room.version++;
    this.emit(roomId,{type:"seat-joined",seat:room.seats[room.seats.length-1],version:room.version});
    return structuredClone(room);
  }
  async sendAction({roomId,playerId,action,applyAction}){
    const room=this.rooms.get(roomId);if(!room)throw new Error("Room not found.");
    if(!room.seats.some(s=>s.id===playerId))throw new Error("Player is not seated in this room.");
    if(typeof applyAction!=="function")throw new Error("A local game reducer is required.");
    const result=applyAction(action);room.version++;this.emit(roomId,{type:"game-action",playerId,action,result,version:room.version});return result;
  }
  subscribe(roomId,listener){
    if(typeof listener!=="function")throw new Error("Listener must be a function.");
    const set=this.listeners.get(roomId)||new Set();set.add(listener);this.listeners.set(roomId,set);
    return ()=>{set.delete(listener);if(!set.size)this.listeners.delete(roomId);};
  }
  async leaveRoom({roomId,playerId}){
    const room=this.rooms.get(roomId);if(!room)return;room.seats=room.seats.filter(s=>s.id!==playerId);room.version++;
    if(!room.seats.length)this.rooms.delete(roomId);else this.emit(roomId,{type:"seat-left",playerId,version:room.version});
  }
  emit(roomId,event){for(const fn of this.listeners.get(roomId)||[])fn(event);}
}
export class NetworkRoomAdapter extends RoomAdapter {
  constructor(transport){super();this.transport=transport;}
  requireTransport(){
    if(!this.transport)throw new Error("Online multiplayer is not enabled. A trusted server transport is required.");
    for(const name of ["connect","request","subscribe","disconnect"])if(typeof this.transport[name]!=="function")throw new Error("Transport must implement "+name+"().");
  }
  async createRoom(payload){this.requireTransport();return this.transport.request("room:create",payload);}
  async joinRoom(payload){this.requireTransport();return this.transport.request("room:join",payload);}
  async sendAction(payload){this.requireTransport();return this.transport.request("game:action",payload);}
  subscribe(roomId,listener){this.requireTransport();return this.transport.subscribe("room:"+roomId,listener);}
  async leaveRoom(payload){this.requireTransport();return this.transport.request("room:leave",payload);}
}
export function createRoomAdapter(mode,transport){
  if(mode==="local")return new LocalRoomAdapter({capacity:8});
  if(mode==="network")return new NetworkRoomAdapter(transport);
  throw new Error("Unknown room adapter mode: "+mode);
}
