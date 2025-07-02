import * as mediasoup from "mediasoup";

// let worker;
// //@ts-ignore
// let router;
// //@ts-ignore
// let producerTransport;
// //@ts-ignore
// let consumerTransport;
// let producer;

// const peers = new Map(); // key: socket.id
// const producers = new Map<string, mediasoup.types.Producer>();

// Structure example:

export type PeerInfo = {
  username: string;
  producerTransport: mediasoup.types.WebRtcTransport | null;
  consumerTransport: mediasoup.types.WebRtcTransport | null;
  producer: Map<string, mediasoup.types.Producer>;
  consumers: mediasoup.types.Consumer[];
};

export type RoomInfo = {
  peers: Map<string, PeerInfo>;
};

const rooms = new Map<string, RoomInfo>();

export function setRooms(roomId :string){
  rooms.set(roomId , { peers: new Map() })
}

export function getRooms(){
    return rooms
}