import 'reflect-metadata';
import { AppDataSource } from '@/configs/database.config';
import { User } from '@/models/users.model';
import { FriendShip } from '@/models/friendship.model';
import { Message } from '@/models/message.model';
import { FriendStatus, MessageType } from '@/constants/constants';
import bcrypt from 'bcryptjs';

async function main() {
  await AppDataSource.initialize();
  const userRepo = AppDataSource.getRepository(User);
  const friendshipRepo = AppDataSource.getRepository(FriendShip);
  const messageRepo = AppDataSource.getRepository(Message);

  // 1) Create or fetch users
  const passwordHash = await bcrypt.hash('123456', 10);

  const aliceEmail = 'alice@example.com';
  const bobEmail = 'bob@example.com';

  let alice = await userRepo.findOne({ where: { email: aliceEmail } });
  if (!alice) {
    alice = userRepo.create({
      name: 'Alice',
      email: aliceEmail,
      password: passwordHash,
      emailVerified: true,
    });
    alice = await userRepo.save(alice);
  }

  let bob = await userRepo.findOne({ where: { email: bobEmail } });
  if (!bob) {
    bob = userRepo.create({
      name: 'Bob',
      email: bobEmail,
      password: passwordHash,
      emailVerified: true,
    });
    bob = await userRepo.save(bob);
  }

  console.log('Users ready:', { alice: alice.idUser, bob: bob.idUser });

  // 2) Create friendship (accepted) if not exists (either direction)
  const existingFriendship =
    (await friendshipRepo.findOne({
      where: { sender_id: { idUser: alice.idUser }, friend_id: { idUser: bob.idUser } },
      relations: ['sender_id', 'friend_id'],
    })) ||
    (await friendshipRepo.findOne({
      where: { sender_id: { idUser: bob.idUser }, friend_id: { idUser: alice.idUser } },
      relations: ['sender_id', 'friend_id'],
    }));

  if (!existingFriendship) {
    const friendship = friendshipRepo.create({
      sender_id: alice,
      friend_id: bob,
      status: FriendStatus.ACCEPTED,
      message: 'Kết bạn nhé!',
    });
    await friendshipRepo.save(friendship);
    console.log('Friendship created (ACCEPTED)');
  } else {
    // Ensure status is ACCEPTED
    if (existingFriendship.status !== FriendStatus.ACCEPTED) {
      existingFriendship.status = FriendStatus.ACCEPTED;
      await friendshipRepo.save(existingFriendship);
      console.log('Friendship updated to ACCEPTED');
    } else {
      console.log('Friendship already exists (ACCEPTED)');
    }
  }

  // 3) Seed some private messages if none exist
  const existingMessagesCount = await messageRepo.count({
    where: [
      { sentBy: { idUser: alice.idUser }, sendToUser: { idUser: bob.idUser }, isDeleted: false },
      { sentBy: { idUser: bob.idUser }, sendToUser: { idUser: alice.idUser }, isDeleted: false },
    ],
  });

  if (existingMessagesCount === 0) {
    const msgs = [
      {
        sentBy: alice,
        sendToUser: bob,
        content: 'Chào Bob! Dạo này thế nào?',
        type: MessageType.TEXT,
      },
      {
        sentBy: bob,
        sendToUser: alice,
        content: 'Chào Alice! Mình ổn, bạn thì sao?',
        type: MessageType.TEXT,
      },
      {
        sentBy: alice,
        sendToUser: bob,
        content: 'Mình cũng ổn. Cuối tuần đi cafe nhé?',
        type: MessageType.TEXT,
      },
      {
        sentBy: bob,
        sendToUser: alice,
        content: 'Ok luôn! Chủ nhật nhé.',
        type: MessageType.TEXT,
      },
    ];

    const messageEntities = msgs.map((m) => messageRepo.create(m));
    await messageRepo.save(messageEntities);
    console.log(`Seeded ${messageEntities.length} messages between Alice and Bob`);
  } else {
    console.log(`Found ${existingMessagesCount} existing messages between users, skipping seeding messages`);
  }

  await AppDataSource.destroy();
  console.log('Seeding completed.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});