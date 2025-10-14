import 'reflect-metadata';
import { AppDataSource } from '@/configs/database.config';
import { User } from '@/models/users.model';
import { FriendShip } from '@/models/friendship.model';
import { Message } from '@/models/message.model';
import { FriendStatus, MessageType } from '@/constants/constants';
import bcrypt from 'bcryptjs';

async function upsertUser(
  email: string,
  name: string,
  plainPassword: string,
  avatarUrl?: string
): Promise<User> {
  const userRepo = AppDataSource.getRepository(User);
  let user = await userRepo.findOne({ where: { email } });

  const password = await bcrypt.hash(plainPassword, 10);

  if (!user) {
    user = userRepo.create({
      name,
      email,
      password,
      emailVerified: true,
      avatarUrl,
    });
    user = await userRepo.save(user);
    console.log(`Created user: ${email} (id=${user.idUser})`);
  } else {
    // Cập nhật lại password để đảm bảo bạn biết mật khẩu test
    user.password = password;
    user.name = name;
    user.emailVerified = true;
    if (avatarUrl) user.avatarUrl = avatarUrl;
    user = await userRepo.save(user);
    console.log(`Updated user: ${email} (id=${user.idUser})`);
  }

  return user;
}

async function ensureFriendship(senderId: number, friendId: number) {
  const fsRepo = AppDataSource.getRepository(FriendShip);

  let fs = await fsRepo.findOne({
    where: {
      sender_id: { idUser: senderId } as any,
      friend_id: { idUser: friendId } as any,
    },
    relations: ['sender_id', 'friend_id'],
  });

  if (!fs) {
    fs = fsRepo.create({
      sender_id: { idUser: senderId } as any,
      friend_id: { idUser: friendId } as any,
      status: FriendStatus.ACCEPTED,
      message: 'Friends via seed',
    });
    await fsRepo.save(fs);
    console.log(`Created friendship: ${senderId} -> ${friendId} (ACCEPTED)`);
  } else if (fs.status !== FriendStatus.ACCEPTED) {
    fs.status = FriendStatus.ACCEPTED;
    fs.message = fs.message || 'Friends via seed';
    await fsRepo.save(fs);
    console.log(`Updated friendship to ACCEPTED: ${senderId} -> ${friendId}`);
  }
}

async function createMessage(
  senderId: number,
  receiverId: number,
  content: string,
  minutesAgo: number = 0
) {
  const messageRepo = AppDataSource.getRepository(Message);
  const userRepo = AppDataSource.getRepository(User);

  const sender = await userRepo.findOne({ where: { idUser: senderId } });
  const receiver = await userRepo.findOne({ where: { idUser: receiverId } });

  if (!sender || !receiver) {
    console.error(`User not found: sender=${senderId}, receiver=${receiverId}`);
    return;
  }

  const message = messageRepo.create({
    content,
    type: MessageType.TEXT,
    sentBy: sender,
    sendToUser: receiver,
    isDeleted: false,
  });

  const savedMessage = await messageRepo.save(message);

  // Cập nhật thời gian tạo tin nhắn (nếu muốn thời gian trong quá khứ)
  if (minutesAgo > 0) {
    const pastTime = new Date();
    pastTime.setMinutes(pastTime.getMinutes() - minutesAgo);
    
    await messageRepo.update(savedMessage.idMessage, {
      createdAt: pastTime
    });
  }

  console.log(`Created message: ${sender.name} -> ${receiver.name}: "${content}"`);
}

async function seedMessages(alice: User, bob: User) {
  console.log('Creating sample messages...');

  // Tạo cuộc trò chuyện mẫu (từ cũ đến mới)
  await createMessage(alice.idUser, bob.idUser, 'Chào Bob! Bạn có khỏe không?', 120);
  await createMessage(bob.idUser, alice.idUser, 'Chào Alice! Mình khỏe, cảm ơn bạn. Còn bạn thì sao?', 118);
  await createMessage(alice.idUser, bob.idUser, 'Mình cũng ổn. Hôm nay bạn có rảnh không?', 115);
  await createMessage(bob.idUser, alice.idUser, 'Có đấy, bạn có kế hoạch gì không?', 110);
  await createMessage(alice.idUser, bob.idUser, 'Mình định đi xem phim, bạn có muốn đi cùng không?', 105);
  await createMessage(bob.idUser, alice.idUser, 'Được đấy! Phim gì vậy?', 100);
  await createMessage(alice.idUser, bob.idUser, 'Phim "The Avengers" mới ra. Bạn có thích phim siêu anh hùng không?', 95);
  await createMessage(bob.idUser, alice.idUser, 'Mình rất thích! Mấy giờ và ở đâu vậy?', 90);
  await createMessage(alice.idUser, bob.idUser, 'Rạp CGV lúc 7h tối nhé. Mình book vé trước?', 85);
  await createMessage(bob.idUser, alice.idUser, 'Ok, bạn book đi. Mình sẽ chuyển tiền cho bạn sau.', 80);
  await createMessage(alice.idUser, bob.idUser, 'Được rồi! Hẹn gặp bạn ở đó lúc 6h45 nhé.', 75);
  await createMessage(bob.idUser, alice.idUser, 'Perfect! See you then! 👍', 70);
  await createMessage(alice.idUser, bob.idUser, 'Yay! Mình rất mong chờ! 🎬🍿', 65);
  
  // Tin nhắn gần đây hơn
  await createMessage(bob.idUser, alice.idUser, 'Btw, bạn có muốn ăn gì trước khi xem phim không?', 30);
  await createMessage(alice.idUser, bob.idUser, 'Có thể ăn pizza được không? Mình đói rồi 😅', 25);
  await createMessage(bob.idUser, alice.idUser, 'Pizza sounds great! Mình biết một chỗ ngon gần rạp.', 20);
  await createMessage(alice.idUser, bob.idUser, 'Awesome! Bạn thật tuyệt vời! 😊', 15);
  await createMessage(bob.idUser, alice.idUser, 'Haha, thank you! Mình cũng rất vui được đi chơi với bạn.', 10);
  await createMessage(alice.idUser, bob.idUser, 'Same here! Mình sẽ dress up một chút nhé 💃', 5);
  await createMessage(bob.idUser, alice.idUser, 'Haha, mình cũng sẽ cố gắng trông presentable! 😄', 2);
  await createMessage(alice.idUser, bob.idUser, 'Bạn luôn trông đẹp mà! See you soon! ❤️', 1);
}

async function main() {
  await AppDataSource.initialize();
  console.log('DataSource initialized');

  const alice = await upsertUser('alice@example.com', 'Alice Johnson', 'password123');
  const bob = await upsertUser('bob@example.com', 'Bob Smith', 'password123');

  // Tạo quan hệ bạn bè (đã accepted)
  await ensureFriendship(alice.idUser, bob.idUser);
  
  // Tạo tin nhắn mẫu
  await seedMessages(alice, bob);

  console.log('Seeding done. Alice and Bob are now friends with chat history!');
  console.log('Login credentials:');
  console.log('- Alice: alice@example.com / password123');
  console.log('- Bob: bob@example.com / password123');
  
  await AppDataSource.destroy();
}

main().catch(async (err) => {
  console.error(err);
  try {
    await AppDataSource.destroy();
  } catch {}
  process.exit(1);
});