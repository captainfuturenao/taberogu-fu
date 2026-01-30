import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

// GET: List Reviews
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const skip = (page - 1) * limit;

  try {
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: {
          storeId: id,
          isDeleted: false,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.review.count({
        where: {
          storeId: id,
          isDeleted: false,
        },
      }),
    ]);

    // Hide editKeyHash
    const safeReviews = reviews.map(({ editKeyHash, ...r }) => r);

    return NextResponse.json({
      data: safeReviews,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

// POST: Create Review
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await req.json();
    // rating, body, authorName, visitedAt
    const { rating, body: reviewBody, authorName, visitedAt } = body;

    if (!rating || !reviewBody) {
      return NextResponse.json({ error: 'Rating and body are required' }, { status: 400 });
    }

    const store = await prisma.store.findUnique({
      where: { id },
    });

    if (!store || store.isDeleted) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Generate edit key
    const editKey = crypto.randomBytes(8).toString('hex');
    const editKeyHash = crypto.createHash('sha256').update(editKey).digest('hex');

    const review = await prisma.review.create({
      data: {
        storeId: id,
        rating: Number(rating),
        body: reviewBody,
        authorName: authorName || '匿名',
        visitedAt: visitedAt ? new Date(visitedAt) : null,
        editKeyHash,
      },
    });

    // Update store updatedAt
    await prisma.store.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json(
      {
        review: {
          ...review,
          editKeyHash: undefined,
        },
        editKey,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
  }
}
