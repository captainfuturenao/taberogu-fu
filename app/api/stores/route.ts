import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const query = searchParams.get('query') || '';
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
        isDeleted: false,
    };

    if (query) {
        where.OR = [
            { name: { contains: query } },
            { address: { contains: query } },
            { genre: { contains: query } },
        ];
    }

    try {
        const [stores, total] = await Promise.all([
            prisma.store.findMany({
                where,
                skip,
                take: limit,
                orderBy: { updatedAt: 'desc' },
                include: {
                    reviews: {
                        select: { rating: true },
                        where: { isDeleted: false },
                    },
                },
            }),
            prisma.store.count({ where }),
        ]);

        // Calculate generic stats (in-memory or use aggregation)
        const storesWithStats = stores.map((store) => {
            const validReviews = store.reviews;
            const count = validReviews.length;
            const avg = count > 0
                ? validReviews.reduce((acc, r) => acc + r.rating, 0) / count
                : 0;

            const { reviews, editKeyHash, ...rest } = store;
            return {
                ...rest,
                reviewCount: count,
                averageRating: parseFloat(avg.toFixed(1)),
            };
        });

        return NextResponse.json({
            data: storesWithStats,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to fetch stores' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, address, phone, businessHours, closedDays, websiteUrl, genre, description } = body;

        if (!name || !address) {
            return NextResponse.json({ error: 'Name and address are required' }, { status: 400 });
        }

        // Generate edit key
        const editKey = crypto.randomBytes(8).toString('hex'); // 16 chars
        const editKeyHash = crypto.createHash('sha256').update(editKey).digest('hex');

        const store = await prisma.store.create({
            data: {
                name,
                address,
                phone,
                businessHours,
                closedDays,
                websiteUrl,
                genre,
                description,
                editKeyHash,
            },
        });

        // Return the store AND the plain text key (only once)
        return NextResponse.json({
            store: {
                ...store,
                editKeyHash: undefined, // Hide hash
            },
            editKey, // Return this to user
        }, { status: 201 });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to create store' }, { status: 500 });
    }
}
