import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

/**
 * app/api/stores/[id]/route.ts
 * - GET: 店舗取得（論理削除は除外）
 * - PATCH: 店舗更新（editKey必須）
 * - DELETE: 店舗論理削除（editKey必須）
 */

// GET: Get Store by ID
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const store = await prisma.store.findUnique({
      where: { id },
    });

    if (!store || (store as any).isDeleted) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // editKeyHashは返さない
    const { editKeyHash, ...safeStore } = store as any;

    return NextResponse.json({ store: safeStore });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch store' }, { status: 500 });
  }
}

// PATCH: Update Store (requires editKey)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await req.json();
    const { editKey, ...updates } = body ?? {};

    if (!editKey) {
      return NextResponse.json({ error: 'Edit key is required' }, { status: 403 });
    }

    const store = await prisma.store.findUnique({
      where: { id },
    });

    if (!store || (store as any).isDeleted) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Verify key
    const hash = crypto.createHash('sha256').update(String(editKey)).digest('hex');
    if (hash !== (store as any).editKeyHash) {
      return NextResponse.json({ error: 'Invalid edit key' }, { status: 403 });
    }

    // 更新可能フィールド（勝手に全部更新しないように制限）
    const allowed: Record<string, any> = {};
    const allowKeys = [
      'name',
      'address',
      'phone',
      'businessHours',
      'closedDays',
      'websiteUrl',
      'genre',
      'description',
    ];

    for (const k of allowKeys) {
      if (k in updates) allowed[k] = updates[k];
    }

    const updated = await prisma.store.update({
      where: { id },
      data: {
        ...allowed,
        updatedAt: new Date(),
      },
    });

    const { editKeyHash, ...safeStore } = updated as any;
    return NextResponse.json({ store: safeStore });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update store' }, { status: 500 });
  }
}

// DELETE: Logical Delete Store (requires editKey)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const { searchParams } = new URL(req.url);
    let key = searchParams.get('key');

    // クエリに無い場合はbodyも見る（保険）
    if (!key) {
      try {
        const body = await req.json();
        key = body?.key || body?.editKey;
      } catch {}
    }

    if (!key) {
      return NextResponse.json({ error: 'Edit key is required' }, { status: 403 });
    }

    const store = await prisma.store.findUnique({
      where: { id },
    });

    if (!store || (store as any).isDeleted) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Verify key
    const hash = crypto.createHash('sha256').update(String(key)).digest('hex');
    if (hash !== (store as any).editKeyHash) {
      return NextResponse.json({ error: 'Invalid edit key' }, { status: 403 });
    }

    await prisma.store.update({
      where: { id },
      data: {
        isDeleted: true,
        updatedAt: new Date(),
      } as any,
    });

    return NextResponse.json({ message: 'Store deleted' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete store' }, { status: 500 });
  }
}
