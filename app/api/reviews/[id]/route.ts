import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

// PATCH: Update Review
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await req.json();
    const { editKey, rating, body: reviewBody, authorName, visitedAt } = body;

    if (!editKey) {
      return NextResponse.json({ error: 'Edit key is required' }, { status: 403 });
    }

    const review = await prisma.review.findUnique({
      where: { id },
    });

    if (!review || review.isDeleted) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    const hash = crypto.createHash('sha256').update(editKey).digest('hex');
    if (hash !== review.editKeyHash) {
      return NextResponse.json({ error: 'Invalid edit key' }, { status: 403 });
    }

    const updated = await prisma.review.update({
      where: { id },
      data: {
        rating: rating !== undefined ? Number(rating) : undefined,
        body: reviewBody,
        authorName,
        visitedAt: visitedAt ? new Date(visitedAt) : undefined,
      },
    });

    await prisma.store.update({
      where: { id: review.storeId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({
      review: {
        ...updated,
        editKeyHash: undefined,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
  }
}

// DELETE: Logical Delete
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const { searchParams } = new URL(req.url);
    let key = searchParams.get('key');

    if (!key) {
      try {
        const body = await req.json();
        key = body.key || body.editKey;
      } catch {}
    }

    if (!key) {
      return NextResponse.json({ error: 'Edit key is required' }, { status: 403 });
    }

    const review = await prisma.review.findUnique({
      where: { id },
    });

    if (!review || review.isDeleted) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    const hash = crypto.createHash('sha256').update(key).digest('hex');
    if (hash !== review.editKeyHash) {
      return NextResponse.json({ error: 'Invalid edit key' }, { status: 403 });
    }

    await prisma.review.update({
      where: { id },
      data: { isDeleted: true },
    });

    await prisma.store.update({
      where: { id: review.storeId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ message: 'Review deleted' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
  }
}
