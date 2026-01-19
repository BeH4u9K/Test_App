--
-- PostgreSQL database dump
--

\restrict kt7OswQaI62ZqqtPOsdg0HvVoa6ZzlQTrWYgqCHFPJAjkwE84lDyDe0NPeWVZQd

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: answer_option; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.answer_option (
    id integer NOT NULL,
    question_id integer NOT NULL,
    text character varying(500) NOT NULL,
    is_correct boolean DEFAULT false
);


ALTER TABLE public.answer_option OWNER TO postgres;

--
-- Name: answer_option_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.answer_option_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.answer_option_id_seq OWNER TO postgres;

--
-- Name: answer_option_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.answer_option_id_seq OWNED BY public.answer_option.id;


--
-- Name: attempt; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.attempt (
    id integer NOT NULL,
    user_id integer NOT NULL,
    test_id integer NOT NULL,
    score integer,
    status character varying(20) DEFAULT 'in_progress'::character varying,
    started_at timestamp without time zone DEFAULT now(),
    completed_at timestamp without time zone,
    version integer DEFAULT 1
);


ALTER TABLE public.attempt OWNER TO postgres;

--
-- Name: attempt_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.attempt_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.attempt_id_seq OWNER TO postgres;

--
-- Name: attempt_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.attempt_id_seq OWNED BY public.attempt.id;


--
-- Name: discipline; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.discipline (
    id integer NOT NULL,
    teacher_id integer,
    name character varying(100),
    description character varying(255),
    is_deleted boolean DEFAULT false
);


ALTER TABLE public.discipline OWNER TO postgres;

--
-- Name: discipline_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.discipline_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.discipline_id_seq OWNER TO postgres;

--
-- Name: discipline_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.discipline_id_seq OWNED BY public.discipline.id;


--
-- Name: question; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.question (
    id integer NOT NULL,
    test_id integer NOT NULL,
    title character varying(200) NOT NULL,
    text text,
    version integer DEFAULT 1,
    root_id integer,
    is_deleted boolean DEFAULT false,
    "position" integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.question OWNER TO postgres;

--
-- Name: question_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.question_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.question_id_seq OWNER TO postgres;

--
-- Name: question_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.question_id_seq OWNED BY public.question.id;


--
-- Name: test; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.test (
    id integer NOT NULL,
    discipline_id integer NOT NULL,
    name character varying(100) NOT NULL,
    is_active boolean DEFAULT true,
    is_deleted boolean DEFAULT false
);


ALTER TABLE public.test OWNER TO postgres;

--
-- Name: test_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.test_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.test_id_seq OWNER TO postgres;

--
-- Name: test_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.test_id_seq OWNED BY public.test.id;


--
-- Name: user_answer; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_answer (
    id integer NOT NULL,
    attempt_id integer,
    question_id integer,
    answer_option_id integer,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.user_answer OWNER TO postgres;

--
-- Name: user_answer_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_answer_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_answer_id_seq OWNER TO postgres;

--
-- Name: user_answer_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_answer_id_seq OWNED BY public.user_answer.id;


--
-- Name: user_discipline; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_discipline (
    user_id integer NOT NULL,
    discipline_id integer NOT NULL
);


ALTER TABLE public.user_discipline OWNER TO postgres;

--
-- Name: user_role; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_role (
    id integer NOT NULL,
    user_id integer NOT NULL,
    role character varying(50) NOT NULL
);


ALTER TABLE public.user_role OWNER TO postgres;

--
-- Name: user_role_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_role_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_role_id_seq OWNER TO postgres;

--
-- Name: user_role_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_role_id_seq OWNED BY public.user_role.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    full_name character varying(150) NOT NULL,
    is_blocked boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    roles jsonb DEFAULT '[]'::jsonb,
    email character varying(150) NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: answer_option id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.answer_option ALTER COLUMN id SET DEFAULT nextval('public.answer_option_id_seq'::regclass);


--
-- Name: attempt id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attempt ALTER COLUMN id SET DEFAULT nextval('public.attempt_id_seq'::regclass);


--
-- Name: discipline id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.discipline ALTER COLUMN id SET DEFAULT nextval('public.discipline_id_seq'::regclass);


--
-- Name: question id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question ALTER COLUMN id SET DEFAULT nextval('public.question_id_seq'::regclass);


--
-- Name: test id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test ALTER COLUMN id SET DEFAULT nextval('public.test_id_seq'::regclass);


--
-- Name: user_answer id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_answer ALTER COLUMN id SET DEFAULT nextval('public.user_answer_id_seq'::regclass);


--
-- Name: user_role id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_role ALTER COLUMN id SET DEFAULT nextval('public.user_role_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: answer_option; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.answer_option (id, question_id, text, is_correct) FROM stdin;
1	1	Именованная область памяти для хранения данных	t
2	1	Константа	f
3	1	Функция	f
4	2	Именованная область памяти для хранения данных	f
5	2	Константа	f
6	2	Часть кода, которая выполняется при вызове	t
\.


--
-- Data for Name: attempt; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.attempt (id, user_id, test_id, score, status, started_at, completed_at, version) FROM stdin;
1	1	1	100	completed	2026-01-14 19:17:14.15664	2026-01-14 19:19:22.799982	1
\.


--
-- Data for Name: discipline; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.discipline (id, teacher_id, name, description, is_deleted) FROM stdin;
2	2	Golang	Ну гоу	f
1	2	Python	Язык программирования, упрощающий жизнь	f
\.


--
-- Data for Name: question; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.question (id, test_id, title, text, version, root_id, is_deleted, "position") FROM stdin;
2	1	Что такое Функция?		1	2	f	1
1	1	Что такое переменная?		1	1	t	1
\.


--
-- Data for Name: test; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.test (id, discipline_id, name, is_active, is_deleted) FROM stdin;
2	1	Циклы	f	f
1	1	Golang	f	f
\.


--
-- Data for Name: user_answer; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_answer (id, attempt_id, question_id, answer_option_id, created_at) FROM stdin;
1	1	1	1	2026-01-14 19:17:14.159004
2	1	2	6	2026-01-14 19:17:14.160822
\.


--
-- Data for Name: user_discipline; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_discipline (user_id, discipline_id) FROM stdin;
\.

INSERT INTO public.user_discipline (user_id, discipline_id) VALUES (1, 1);
INSERT INTO public.user_discipline (user_id, discipline_id) VALUES (1, 2);

--
-- Data for Name: user_role; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_role (id, user_id, role) FROM stdin;
3	1	student
4	1	admin
5	1	teacher
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, full_name, is_blocked, created_at, roles, email) FROM stdin;
2	Георгий Преподаватель	f	2026-01-14 18:57:04.362372	[]	example@gmail.com
1	Новое имя	f	2026-01-14 18:56:55.224319	[]	shahterchannel@gmail.com
3	Костя студент	f	2026-01-16 15:06:17.125359	[]	kostya@example.com
\.


--
-- Name: answer_option_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.answer_option_id_seq', 6, true);


--
-- Name: attempt_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.attempt_id_seq', 1, true);


--
-- Name: discipline_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.discipline_id_seq', 2, true);


--
-- Name: question_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.question_id_seq', 2, true);


--
-- Name: test_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.test_id_seq', 2, true);


--
-- Name: user_answer_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_answer_id_seq', 2, true);


--
-- Name: user_role_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_role_id_seq', 5, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 3, true);


--
-- Name: answer_option answer_option_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.answer_option
    ADD CONSTRAINT answer_option_pkey PRIMARY KEY (id);


--
-- Name: attempt attempt_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attempt
    ADD CONSTRAINT attempt_pkey PRIMARY KEY (id);


--
-- Name: attempt attempt_user_id_test_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attempt
    ADD CONSTRAINT attempt_user_id_test_id_key UNIQUE (user_id, test_id);


--
-- Name: discipline discipline_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.discipline
    ADD CONSTRAINT discipline_pkey PRIMARY KEY (id);


--
-- Name: question question_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question
    ADD CONSTRAINT question_pkey PRIMARY KEY (id);


--
-- Name: test test_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test
    ADD CONSTRAINT test_pkey PRIMARY KEY (id);


--
-- Name: user_answer user_answer_attempt_id_question_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_answer
    ADD CONSTRAINT user_answer_attempt_id_question_id_key UNIQUE (attempt_id, question_id);


--
-- Name: user_answer user_answer_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_answer
    ADD CONSTRAINT user_answer_pkey PRIMARY KEY (id);


--
-- Name: user_discipline user_discipline_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_discipline
    ADD CONSTRAINT user_discipline_pkey PRIMARY KEY (user_id, discipline_id);


--
-- Name: user_role user_role_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_role
    ADD CONSTRAINT user_role_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: answer_option answer_option_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.answer_option
    ADD CONSTRAINT answer_option_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.question(id);


--
-- Name: attempt attempt_test_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attempt
    ADD CONSTRAINT attempt_test_id_fkey FOREIGN KEY (test_id) REFERENCES public.test(id);


--
-- Name: attempt attempt_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attempt
    ADD CONSTRAINT attempt_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: discipline discipline_teacher_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.discipline
    ADD CONSTRAINT discipline_teacher_fkey FOREIGN KEY (teacher_id) REFERENCES public.users(id);


--
-- Name: question question_test_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question
    ADD CONSTRAINT question_test_id_fkey FOREIGN KEY (test_id) REFERENCES public.test(id);


--
-- Name: test test_discipline_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test
    ADD CONSTRAINT test_discipline_id_fkey FOREIGN KEY (discipline_id) REFERENCES public.discipline(id);


--
-- Name: user_answer user_answer_answer_option_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_answer
    ADD CONSTRAINT user_answer_answer_option_id_fkey FOREIGN KEY (answer_option_id) REFERENCES public.answer_option(id);


--
-- Name: user_answer user_answer_attempt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_answer
    ADD CONSTRAINT user_answer_attempt_id_fkey FOREIGN KEY (attempt_id) REFERENCES public.attempt(id) ON DELETE CASCADE;


--
-- Name: user_answer user_answer_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_answer
    ADD CONSTRAINT user_answer_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.question(id);


--
-- Name: user_discipline user_discipline_discipline_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_discipline
    ADD CONSTRAINT user_discipline_discipline_id_fkey FOREIGN KEY (discipline_id) REFERENCES public.discipline(id) ON DELETE CASCADE;


--
-- Name: user_discipline user_discipline_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_discipline
    ADD CONSTRAINT user_discipline_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_role user_role_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_role
    ADD CONSTRAINT user_role_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict kt7OswQaI62ZqqtPOsdg0HvVoa6ZzlQTrWYgqCHFPJAjkwE84lDyDe0NPeWVZQd

