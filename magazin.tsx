import useTranslation from 'next-translate/useTranslation';
import { ReactElement, useEffect } from 'react';
import { Translate } from 'next-translate';
import MainPostCard from '@/components/cards/MainPostCard';
import Grid from '@/components/layout/Grid';
import { NextPage } from 'next';
import { fetcher } from '@/helpers/fetcher';
import { LocalizedMagazineQuery } from '@/graphql/MagazineQuery';
import { Locale, Locales, Posts } from '@/types';
import { revalidate } from '@/globals';
import Newsletter from '@/components/sections/Newsletter';
import PostCard from '@/components/cards/PostCard';
import Button from '@/components/core/Button';
import { useRouter } from 'next/router';
import { useScrollToElement } from '@/hooks/useScrollToElement';
import Link from 'next/link';
import Image from '@/components/core/Image';
import Typo from '@/components/core/Typo';
import Icon from '@/components/core/Icon';
import SubscribeBanner from '@/components/banners/SubscribeBanner';
import ContactBanner from '@/components/banners/ContactBanner';

interface PostProps {
	mainPost: Posts.Card | null;
	posts: Posts.Card[] | null;
	authors: Posts.Author[] | null;
	people: Posts.Card[] | null;
	redirect?: boolean;
}

export const getStaticProps = async ({ locale }: { locale: Locale }): Promise<{ props: PostProps; revalidate?: number }> => {
	let { posts }: { posts: Posts.Card[] } = await fetcher(LocalizedMagazineQuery, { languages_code: Locales[locale] });

	if (posts.length === 0) {
		return {
			props: {
				mainPost: null,
				posts: null,
				people: null,
				authors: null,
			},
			revalidate,
		};
	}

	const authors: Posts.Author[] = [];

	posts.forEach(({ post_author }) => {
		if (!post_author || authors.some((item) => item.name === post_author.name)) return;
		authors.push(post_author);
	});

	//GET MAIN POST AND FILTER HIM OUT
	const mainPost: Posts.Card = posts.filter((item: Posts.Card) => item.magazine_hp_main)[0];
	posts = posts.filter((item: Posts.Card) => item.id !== mainPost?.id);

	//GET PINNED POST AND FILTER HIM OUT
	const peoplePost = posts.filter((item: Posts.Card) => item.category === 'people');
	posts = posts.filter((item: Posts.Card) => item.category !== 'people');

	return {
		props: {
			mainPost: mainPost || null,
			posts: posts || null,
			authors: authors || null,
			people: peoplePost || null,
			redirect: false,
		},
		revalidate,
	};
};

const Magazine: NextPage<PostProps> = ({ redirect, mainPost, posts, authors, people }): ReactElement<'main'> => {
	const router = useRouter();

	useEffect(() => {
		if (redirect) router.push('/');
	}, []);

	if (redirect) return null;

	const { t }: { t: Translate } = useTranslation('magazine');

	const { scrollToTarget } = useScrollToElement();

	return (
		<main className="magazine">
			<div className="container">
				{mainPost && <MainPostCard {...mainPost} />}

				<div className="magazine__sections" id={'magazine-sections'}>
					{posts.length > 0 && (
						<div className="magazine__list" id={'magazine-top'}>
							<div className="magazine__list-left">
								<Grid variant={'magazine'}>
									{posts.slice(0, 5).map((item, index) => {
										return <PostCard {...item} key={`post 0-5: ${index}`} variant="horizontal-new" />;
									})}
								</Grid>
							</div>
							<div className="magazine__list-right">
								<SubscribeBanner />
								<ContactBanner />
							</div>
						</div>
					)}
				</div>
			</div>

			<div className="magazine__sections-gray">
				{authors.length > 0 && (
					<div className="magazine__people container" id={'people'}>
						<Typo variant={'h2'} color="black" className={'magazine__people-title'}>
							{t('postCategories.people')}
						</Typo>
						<div className="magazine__people-wrapper">
							<div className="magazine__people-card">{people.length > 0 && <PostCard {...people[0]} />}</div>
							<div className="magazine__people-list">
								<Grid variant={'people'}>
									{authors?.slice(0, 6).map((author, index) => {
										return (
											<Link href={`${t('pages:authors')}?author=${author.name}`} key={`author: ${index}`}>
												<a className={'magazine__author'}>
													{author.image ? (
														<div className="magazine__author-thumbnail">
															<Image src={`${process.env['NEXT_PUBLIC_ASSETS_FOLDER']}/${author.image.id}`} objectFit={'cover'} />
														</div>
													) : (
														<Icon
															name={'people'}
															className={'magazine__author-thumbnail magazine__author-thumbnail--placeholder'}
														/>
													)}
													<Typo variant={'h6'} className={'magazine__author-name'}>
														{author.name}
													</Typo>
													{author.role && (
														<Typo variant={'sm'} className={'magazine__author-role'}>
															{author.role}
														</Typo>
													)}
												</a>
											</Link>
										);
									})}
								</Grid>
							</div>
						</div>
					</div>
				)}
			</div>

			{posts.length > 5 && (
				<div className="magazine__list container" id={'magazine-top'}>
					<div className="magazine__list-left">
						<Grid variant={'magazine'}>
							{posts.slice(5, 10).map((item, index) => {
								return <PostCard {...item} key={`post 5-10: ${index}`} variant="horizontal-new" />;
							})}
						</Grid>
						<div className={'magazine__cta'}>
							<Link href="#" passHref>
								<Button variant={'primary'}>{t('buttons.more_posts')}</Button>
							</Link>
						</div>
					</div>
				</div>
			)}

			<Newsletter />
		</main>
	);
};

export default Magazine;
