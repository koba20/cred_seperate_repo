const generateRoomId = (senderId: string, receiverId: string) =>{
    const sortedUserIds = [senderId, receiverId].sort();
console.log(sortedUserIds)
    return `${sortedUserIds[0]}${sortedUserIds[1]}`;
  }

  export default generateRoomId

  