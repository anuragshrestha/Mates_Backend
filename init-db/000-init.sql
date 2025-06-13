--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5 (Postgres.app)
-- Dumped by pg_dump version 17.5 (Postgres.app)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
-- SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: follows; Type: TABLE; Schema: public; Owner: anuragshrestha
--

CREATE TABLE public.follows (
    follower_id uuid NOT NULL,
    followee_id uuid NOT NULL,
    followed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.follows OWNER TO anuragshrestha;

--
-- Name: posts; Type: TABLE; Schema: public; Owner: anuragshrestha
--

CREATE TABLE public.posts (
    post_id uuid NOT NULL,
    email character varying(255) NOT NULL,
    image_url text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    status text,
    user_id uuid,
    university_name text
);


ALTER TABLE public.posts OWNER TO anuragshrestha;

--
-- Name: users; Type: TABLE; Schema: public; Owner: anuragshrestha
--

CREATE TABLE public.users (
    email character varying(150) NOT NULL,
    full_name character varying(150) NOT NULL,
    university_name character varying(150) NOT NULL,
    major character varying(100) NOT NULL,
    school_year character varying(50) NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    profile_image_url text,
    user_id uuid NOT NULL
);


ALTER TABLE public.users OWNER TO anuragshrestha;

--
-- Data for Name: follows; Type: TABLE DATA; Schema: public; Owner: anuragshrestha
--

COPY public.follows (follower_id, followee_id, followed_at) FROM stdin;
\.


--
-- Data for Name: posts; Type: TABLE DATA; Schema: public; Owner: anuragshrestha
--

COPY public.posts (post_id, email, image_url, created_at, status, user_id, university_name) FROM stdin;
2650ecbb-c08b-46a6-b450-b929199bd3ce	ashrestha@unm.edu	http://mates-users-post-image.s3.us-east-2.amazonaws.com/University of New Mexico/ashrestha@unm.edu/2650ecbb-c08b-46a6-b450-b929199bd3ce.png	2025-06-02 00:04:39.493	I hate my math professor	\N	\N
d62cc27f-973e-488c-b845-47c54bb38b95	ashrestha@unm.edu	http://mates-users-post-image.s3.us-east-2.amazonaws.com/University of New Mexico/ashrestha@unm.edu/d62cc27f-973e-488c-b845-47c54bb38b95.png	2025-06-02 00:09:28.364	I hate my math professor	\N	\N
f4e726b5-e28e-42bf-8807-890ba14be7f5	ashrestha@unm.edu	http://mates-users-post-image.s3.us-east-2.amazonaws.com/University of New Mexico/ashrestha@unm.edu/f4e726b5-e28e-42bf-8807-890ba14be7f5.png	2025-06-02 00:28:47.997	I hate my math professor	\N	\N
d0c3c4b3-3704-484b-88cb-21c60354ddd6	ashrestha@unm.edu	http://mates-users-post-image.s3.us-east-2.amazonaws.com/University of New Mexico/ashrestha@unm.edu/d0c3c4b3-3704-484b-88cb-21c60354ddd6.png	2025-06-02 00:30:34.496	I hate my math professor	\N	\N
fc8f01e1-ca9a-480f-9431-c22cd366509c	ashrestha@unm.edu	http://mates-users-post-image.s3.us-east-2.amazonaws.com/University of New Mexico/ashrestha@unm.edu/fc8f01e1-ca9a-480f-9431-c22cd366509c.png	2025-06-02 00:47:33.181	It was a good day	\N	\N
7e0421a1-f22d-4894-84ff-142896f89b76	ashrestha@unm.edu	\N	2025-06-02 05:57:39.623		\N	\N
0038016d-7c90-4dc4-8f53-278f5589a34d	ashrestha@unm.edu	\N	2025-06-03 00:08:43.895	a random status	\N	\N
b5f8a0bb-2da2-4974-952e-0f70642f34d7	ashrestha@unm.edu	\N	2025-06-03 00:09:51.602	a random status	\N	\N
ea64b583-2ebc-46cc-b459-3843f9b4d179	ashrestha@unm.edu	\N	2025-06-03 00:13:09.717	random 	\N	\N
d8b8730b-7619-465e-85cd-36d2b652144d	ashrestha@unm.edu	\N	2025-06-03 00:19:02.819	randommm	\N	\N
c34e4f2a-0f16-4ace-957d-47f0b2fad101	ashrestha@unm.edu	http://mates-users-post-image.s3.us-east-2.amazonaws.com/University of New Mexico/ashrestha@unm.edu/c34e4f2a-0f16-4ace-957d-47f0b2fad101.jpg	2025-06-03 00:32:20.494	hancies	\N	\N
eeb0bbef-351d-462e-ae01-f6e7f5ef14bf	ashrestha@unm.edu	http://mates-users-post-image.s3.us-east-2.amazonaws.com/University of New Mexico/ashrestha@unm.edu/eeb0bbef-351d-462e-ae01-f6e7f5ef14bf.jpg	2025-06-03 00:43:38.878	testing	\N	\N
38251615-e63d-4fe0-bd33-5543e9653bf8	ashrestha@unm.edu	\N	2025-06-03 00:50:37.728	Testing 1	\N	\N
e0de16b4-cb4f-4a28-aaff-880ebe8c7ff8	ashrestha@unm.edu	http://mates-users-post-image.s3.us-east-2.amazonaws.com/University of New Mexico/ashrestha@unm.edu/e0de16b4-cb4f-4a28-aaff-880ebe8c7ff8.jpg	2025-06-03 00:51:48.586	testing 2	\N	\N
6c126419-675b-4a3c-96ae-daa75f0fa932	ashrestha@unm.edu	http://mates-users-post-image.s3.us-east-2.amazonaws.com/University of New Mexico/ashrestha@unm.edu/6c126419-675b-4a3c-96ae-daa75f0fa932.jpg	2025-06-03 01:00:52.365	okay	\N	\N
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: anuragshrestha
--

COPY public.users (email, full_name, university_name, major, school_year, created_at, profile_image_url, user_id) FROM stdin;
ashrestha@unm.edu	Anurag Shrestha	University of New Mexico	Computer Science	Senior	2025-06-01 18:59:49.922588	https://mates-users-profile-image.s3.us-east-2.amazonaws.com/profile_images/ashrestha@unm.edu.jpg	bcf0e566-5bf2-43ec-ac4a-266c2342cf2e
bshre@unm.edu	Bikash pandey	Universitas Nusa Putra	Agricultural Business and Technology	Senior	2025-06-02 22:37:40.591816	https://mates-users-profile-image.s3.us-east-2.amazonaws.com/profile_images/bshre@unm.edu.jpg	217b15e0-c061-70ca-cdc9-3f3486f57841
\.


--
-- Name: follows follows_pkey; Type: CONSTRAINT; Schema: public; Owner: anuragshrestha
--

ALTER TABLE ONLY public.follows
    ADD CONSTRAINT follows_pkey PRIMARY KEY (follower_id, followee_id);


--
-- Name: posts posts_pkey; Type: CONSTRAINT; Schema: public; Owner: anuragshrestha
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (post_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: anuragshrestha
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: anuragshrestha
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: idx_posts_create_at; Type: INDEX; Schema: public; Owner: anuragshrestha
--

CREATE INDEX idx_posts_create_at ON public.posts USING btree (created_at);


--
-- Name: idx_posts_uni_name; Type: INDEX; Schema: public; Owner: anuragshrestha
--

CREATE INDEX idx_posts_uni_name ON public.posts USING btree (university_name);


--
-- Name: idx_posts_user_id; Type: INDEX; Schema: public; Owner: anuragshrestha
--

CREATE INDEX idx_posts_user_id ON public.posts USING btree (user_id);


--
-- Name: follows follows_followee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: anuragshrestha
--

ALTER TABLE ONLY public.follows
    ADD CONSTRAINT follows_followee_id_fkey FOREIGN KEY (followee_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: follows follows_follower_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: anuragshrestha
--

ALTER TABLE ONLY public.follows
    ADD CONSTRAINT follows_follower_id_fkey FOREIGN KEY (follower_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

