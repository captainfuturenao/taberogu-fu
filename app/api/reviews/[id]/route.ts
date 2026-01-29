import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

// PATCH: Update Review
export async function PATCH(
    req: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const body = await req.json();
        const { editKey, rating, body: reviewBody, authorName, visitedAt } = body;

        if (!editKey) {
            return NextResponse.json({ error: 'Edit key is required' }, { status: 403 });
        }

        const review = await prisma.review.findUnique({
            where: { id: params.id },
        });

        if (!review || review.isDeleted) {
            return NextResponse.json({ error: 'Review not found' }, { status: 404 });
        }

        // Verify key
        const hash = crypto.createHash('sha256').update(editKey).digest('hex');
        if (hash !== review.editKeyHash) {
            return NextResponse.json({ error: 'Invalid edit key' }, { status: 403 });
        }

        const updated = await prisma.review.update({
            where: { id: params.id },
            data: {
                rating: rating !== undefined ? Number(rating) : undefined,
                body: reviewBody,
                authorName,
                visitedAt: visitedAt ? new Date(visitedAt) : undefined,
            },
        });

        // Update store updatedAt
        await prisma.store.update({
            where: { id: review.storeId },
            data: { updatedAt: new Date() },
        });

        return NextResponse.json({
            review: {
                ...updated,
                editKeyHash: undefined,
            }
        });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
    }
}

// DELETE: Logical Delete
export async function DELETE(
    req: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const { searchParams } = new URL(req.url);
        const editKey = searchParams.get('key');

        // Check body if query is empty (as backup)
        let key = editKey;
        if (!key) {
            try {
                const body = await req.json();
                key = body.key || body.editKey;
            } catch (e) { }
        }

        if (!key) {
            return NextResponse.json({ error: 'Edit key is required' }, { status: 403 });
        }

        const review = await prisma.review.findUnique({
            where: { id: params.id },
        });

        if (!review || review.isDeleted) {
            return NextResponse.json({ error: 'Review not found' }, { status: 404 });
        }

        // Verify key
        const hash = crypto.createHash('sha256').update(key).digest('hex');
        if (hash !== review.editKeyHash) {
            return NextResponse.json({ error: 'Invalid edit key' }, { status: 403 });
        }

        await prisma.review.update({
            where: { id: params.id },
            data: { isDeleted: true },
        });

        // Update store stats? Or just updatedAt
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
