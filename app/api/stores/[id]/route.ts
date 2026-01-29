import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

// GET: Store Details
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const store = await prisma.store.findUnique({
            where: { id: params.id },
            include: {
                reviews: {
                    select: { rating: true },
                    where: { isDeleted: false },
                },
            },
        });

        if (!store || store.isDeleted) {
            return NextResponse.json({ error: 'Store not found' }, { status: 404 });
        }

        const validReviews = store.reviews;
        const count = validReviews.length;
        const avg = count > 0
            ? validReviews.reduce((acc, r) => acc + r.rating, 0) / count
            : 0;

        const { reviews, editKeyHash, ...rest } = store;

        return NextResponse.json({
            ...rest,
            reviewCount: count,
            averageRating: parseFloat(avg.toFixed(1)),
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to fetch store' }, { status: 500 });
    }
}

// PATCH: Update Store
export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await req.json();
        const { editKey, ...data } = body;

        if (!editKey) {
            return NextResponse.json({ error: 'Edit key is required' }, { status: 403 });
        }

        const store = await prisma.store.findUnique({
            where: { id: params.id },
        });

        if (!store || store.isDeleted) {
            return NextResponse.json({ error: 'Store not found' }, { status: 404 });
        }

        // Verify key
        const hash = crypto.createHash('sha256').update(editKey).digest('hex');
        if (hash !== store.editKeyHash) {
            return NextResponse.json({ error: 'Invalid edit key' }, { status: 403 });
        }

        // Update
        // Allowed fields
        const { name, address, phone, businessHours, closedDays, websiteUrl, genre, description } = data;

        const updated = await prisma.store.update({
            where: { id: params.id },
            data: {
                name, address, phone, businessHours, closedDays, websiteUrl, genre, description
            },
        });

        return NextResponse.json({
            store: {
                ...updated,
                editKeyHash: undefined,
            }
        });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to update store' }, { status: 500 });
    }
}

// DELETE: Logical Delete
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { searchParams } = new URL(req.url);
        const editKey = searchParams.get('key'); // Or from body, but DELETE usually has no body? Req says "key required". Usually query param for DELETE.

        // If body is needed, we need to read req.json(), but some clients/browsers don't send body in DELETE.
        // However, requirement document just says "DELETE ... (key必須)".
        // I check both query and body if possible, or stick to query for DELETE. Or Header.
        // Let's try body first, catching error if empty.
        let key = editKey;
        if (!key) {
            try {
                const body = await req.json();
                key = body.key || body.editKey;
            } catch (e) {
                // No body
            }
        }

        if (!key) {
            return NextResponse.json({ error: 'Edit key is required' }, { status: 403 });
        }

        const store = await prisma.store.findUnique({
            where: { id: params.id },
        });

        if (!store || store.isDeleted) {
            return NextResponse.json({ error: 'Store not found' }, { status: 404 });
        }

        // Verify key
        const hash = crypto.createHash('sha256').update(key).digest('hex');
        if (hash !== store.editKeyHash) {
            return NextResponse.json({ error: 'Invalid edit key' }, { status: 403 });
        }

        // Logical delete
        await prisma.store.update({
            where: { id: params.id },
            data: { isDeleted: true },
        });

        return NextResponse.json({ message: 'Store deleted' });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to delete store' }, { status: 500 });
    }
}
