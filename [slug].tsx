import { FunctionComponent, ReactComponentElement, Fragment } from 'react';
import { fetcher } from '@/helpers/fetcher';
import { MagazineQuery, RelatedMagazineQuery } from '@/graphql/MagazineQuery';
import { PostDetailQuery } from '@/graphql/PostQuery';
import { Locale, Locales, Posts } from '@/types';
import { revalidate } from '@/globals';
import { useRouter } from 'next/router';
import stringLib from '@/libs/string';
import Link from 'next/link';
import useTranslation from 'next-translate/useTranslation';
import { Translate } from 'next-translate';

import Typo from '@/components/core/Typo';
import Detail from '@/components/parts/Detail';
import Grid from '@/components/layout/Grid';
import Tag from '@/components/parts/Tag';
import PostCard from '@/components/cards/PostCard';
import SubscribeBanner from '@/components/banners/SubscribeBanner';
import ContactBanner from '@/components/banners/ContactBanner';
import AppBanner from '@/components/banners/AppBanner';
import Newsletter from '@/components/sections/Newsletter';
import Icon from '@/components/core/Icon';
interface Path {
	params: { slug: string };
	locale: Locale;
}

interface Props {
	mainPost: Posts.Post;
	relatedPosts: Posts.Card[];
}

export const getStaticPaths = async (): Promise<{ paths: Path[]; fallback: true }> => {
	const paths: Path[] = [];

	await (async () => {
		const { posts } = await fetcher(MagazineQuery);

		posts.forEach(({ slug }) => {
			paths.push({ params: { slug }, locale: 'cs' });
		});
	})();

	return {
		paths,
		fallback: true,
	};
};

export const getStaticProps = async ({
	params: { slug },
	locale,
}: {
	params: { slug: string };
	locale: Locale;
}): Promise<{ props: Props; revalidate: number }> => {
	const { posts } = await fetcher(PostDetailQuery, { slug, languages_code: Locales[locale] });

	const mainPost: Posts.Post = posts[0];
	const { category, id } = mainPost;

	const { posts: relatedPosts } = await fetcher(RelatedMagazineQuery, { category, id, languages_code: Locales[locale] });

	//parse html and add queries to the image tags
	const sources = (stringLib(mainPost.content) as any).between('img src="', '"');
	sources?.forEach((src: string) => {
		mainPost.content = mainPost.content.replace(src, `${src}&withoutEnlargement=true&width=1520&quality=95`);
	});

	return {
		props: {
			mainPost,
			relatedPosts,
		},
		revalidate,
	};
};

const Post: FunctionComponent<Props> = ({ mainPost, relatedPosts }): ReactComponentElement<'main'> => {
	const router = useRouter();
	const { t }: { t: Translate } = useTranslation();

	if (router.isFallback) {
		return <div>Loading...</div>;
	}

	return (
		<main className="post">
			<div className="container">
				<div className="post__container-header">
					<Link href={t('pages:magazine')} passHref>
						<Typo Tag={'a'} color={'congress-blue'} variant={'lg'} className={'post__container-back'}>
							<Icon name={'arrow-left'} /> {t('magazine:buttons.back')}
						</Typo>
					</Link>
					<Link href={t('pages:category') + `?category=${t(`magazine:postCategories.${Posts.PostCategories[mainPost.category]}`)}`} passHref>
						<Tag className={'detail__tag-head'}>{Posts.PostCategories[mainPost.category]}</Tag>
					</Link>
					<Typo variant={'h2'} color="black" className="post__headline">
						{mainPost.headline}
					</Typo>
				</div>

				<section className="post__container">
					<Detail {...mainPost} />
					<aside className="post__sidebar">
						<SubscribeBanner />
						<ContactBanner />
					</aside>
				</section>
			</div>

			<section className="post__related">
				<Typo variant={'h2'} color="black" className="post__related-headline">
					{t('common:read-more.title')}
				</Typo>
				<div className="container">
					{relatedPosts.length > 0 && (
						<Grid variant={'three-columns-template'} className={'post__related-grid'}>
							{relatedPosts.slice(0, 3).map((item, index) => {
								return (
									<Fragment key={`related post: ${index}`}>
										<PostCard {...item} variant="horizontal-small" />
									</Fragment>
								);
							})}
						</Grid>
					)}

					<AppBanner />
				</div>
			</section>
			<Newsletter />
		</main>
	);
};

export default Post;
