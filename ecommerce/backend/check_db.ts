import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const products = await prisma.product.findMany({
    include: { images: true }
  });
  products.forEach(p => {
    console.log(`Product: ${p.name}`);
    p.images.forEach(img => {
      console.log(`  - Image: ${img.imageUrl} (Main: ${img.isMain})`);
    });
  });
}
main().catch(console.error).finally(() => prisma.$disconnect());
