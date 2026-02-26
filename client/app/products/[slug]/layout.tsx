import type { Metadata } from 'next';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

type Props = { params: Promise<{ slug: string }>; children: React.ReactNode };

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const res = await fetch(`${API_URL}/products/slug/${encodeURIComponent(slug)}`, { next: { revalidate: 60 } });
    const json = await res.json();
    const product = json?.data;
    if (!product?.name) return { title: 'Product | Jewellery Store' };
    const title = `${product.name} | Jewellery Store`;
    const description =
      product.shortDescription ||
      product.description?.slice(0, 160) ||
      `Buy ${product.name}. Pan India shipping.`;
    const image = product.images?.[0]?.url;
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        ...(image && { images: [image] }),
      },
    };
  } catch {
    return { title: 'Product | Jewellery Store' };
  }
}

export default function ProductSlugLayout({ children }: Props) {
  return <>{children}</>;
}
