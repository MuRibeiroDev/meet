docker : pg_dump: last built-in OID is 16383
No linha:1 caractere:1
+ docker run --rm -e PGPASSWORD=zXZzR79pzJ1x032uE postgres:15-alpine pg ...
+ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : NotSpecified: (pg_dump: last built-in OID is 16383:String) [], RemoteE 
   xception
    + FullyQualifiedErrorId : NativeCommandError
 
pg_dump: reading extensions
pg_dump: identifying extension members
pg_dump: reading schemas
pg_dump: reading user-defined tables
pg_dump: reading user-defined functions
pg_dump: reading user-defined types
pg_dump: reading procedural languages
pg_dump: reading user-defined aggregate functions
pg_dump: reading user-defined operators
pg_dump: reading user-defined access methods
pg_dump: reading user-defined operator classes
pg_dump: reading user-defined operator families
pg_dump: reading user-defined text search parsers
pg_dump: reading user-defined text search templates
pg_dump: reading user-defined text search dictionaries
pg_dump: reading user-defined text search configurations
pg_dump: reading user-defined foreign-data wrappers
pg_dump: reading user-defined foreign servers
pg_dump: reading default privileges
pg_dump: reading user-defined collations
pg_dump: reading user-defined conversions
pg_dump: reading type casts
pg_dump: reading transforms
pg_dump: reading table inheritance information
pg_dump: reading event triggers
pg_dump: finding extension tables
pg_dump: finding inheritance relationships
pg_dump: reading column info for interesting tables
pg_dump: finding table default expressions
pg_dump: finding table check constraints
pg_dump: flagging inherited columns in subtables
pg_dump: reading partitioning data
pg_dump: reading indexes
pg_dump: flagging indexes in partitioned tables
pg_dump: reading extended statistics
pg_dump: reading constraints
pg_dump: reading triggers
pg_dump: reading rewrite rules
pg_dump: reading policies
pg_dump: reading row-level security policies
pg_dump: reading publications
pg_dump: reading publication membership of tables
pg_dump: reading publication membership of schemas
pg_dump: reading subscriptions
pg_dump: reading large objects
pg_dump: reading dependency data
pg_dump: saving encoding = UTF8
pg_dump: saving standard_conforming_strings = on
pg_dump: saving search_path = 
--
-- PostgreSQL database dump
--

\restrict fagqI6fMgHLrc44bMOReA8Pei1yeP4wOUgdO1TL774KlwTKWIdtjSMVYFnIS6Vq

-- Dumped from database version 12.20 (Ubuntu 12.20-0ubuntu0.20.04.1)
-- Dumped by pg_dump version 15.14

-- Started on 2025-10-30 13:13:21 UTC

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.historico_agendamentos DROP CONSTRAINT IF EXISTS historico_agendamentos_usuario_id_fkey;
ALTER TABLE IF EXISTS ONLY public.historico_agendamentos DROP CONSTRAINT IF EXISTS historico_agendamentos_agendamento_id_fkey;
ALTER TABLE IF EXISTS ONLY public.agendamentos DROP CONSTRAINT IF EXISTS agendamentos_usuario_id_fkey;
ALTER TABLE IF EXISTS ONLY public.agendamentos DROP CONSTRAINT IF EXISTS agendamentos_sala_id_fkey;
DROP TRIGGER IF EXISTS trigger_usuarios_timestamp ON public.usuarios;
DROP TRIGGER IF EXISTS trigger_salas_timestamp ON public.salas;
DROP TRIGGER IF EXISTS trigger_agendamentos_timestamp ON public.agendamentos;
DROP INDEX IF EXISTS public.idx_usuarios_email;
DROP INDEX IF EXISTS public.idx_agendamentos_usuario;
DROP INDEX IF EXISTS public.idx_agendamentos_status;
DROP INDEX IF EXISTS public.idx_agendamentos_sala_id;
DROP INDEX IF EXISTS public.idx_agendamentos_sala;
DROP INDEX IF EXISTS public.idx_agendamentos_data_inicio;
DROP INDEX IF EXISTS public.idx_agendamentos_data_fim;
ALTER TABLE IF EXISTS ONLY public.usuarios DROP CONSTRAINT IF EXISTS usuarios_pkey;
ALTER TABLE IF EXISTS ONLY public.usuarios DROP CONSTRAINT IF EXISTS usuarios_email_key;
ALTER TABLE IF EXISTS ONLY public.salas DROP CONSTRAINT IF EXISTS salas_pkey;
ALTER TABLE IF EXISTS ONLY public.salas DROP CONSTRAINT IF EXISTS salas_nome_key;
ALTER TABLE IF EXISTS ONLY public.historico_agendamentos DROP CONSTRAINT IF EXISTS historico_agendamentos_pkey;
ALTER TABLE IF EXISTS ONLY public.agendamentos DROP CONSTRAINT IF EXISTS agendamentos_pkey;
ALTER TABLE IF EXISTS public.usuarios ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.salas ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.historico_agendamentos ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.agendamentos ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.usuarios_id_seq;
DROP TABLE IF EXISTS public.usuarios;
DROP SEQUENCE IF EXISTS public.salas_id_seq;
DROP TABLE IF EXISTS public.salas;
DROP SEQUENCE IF EXISTS public.historico_agendamentos_id_seq;
DROP TABLE IF EXISTS public.historico_agendamentos;
DROP SEQUENCE IF EXISTS public.agendamentos_id_seq;
DROP TABLE IF EXISTS public.agendamentos;
DROP FUNCTION IF EXISTS public.update_timestamp();
DROP FUNCTION IF EXISTS public.sp_obter_detalhes_agendamento(p_agendamento_id integer);
DROP FUNCTION IF EXISTS public.sp_listar_agendamentos_por_periodo(p_data_inicio timestamp without time zone, p_data_fim timestamp without time zone);
DROP FUNCTION IF EXISTS public.sp_listar_agendamentos_por_data(p_data date);
DROP FUNCTION IF EXISTS public.sp_criar_agendamento(p_titulo character varying, p_descricao text, p_data_inicio timestamp without time zone, p_data_fim timestamp without time zone, p_participantes integer, p_link_reuniao character varying, p_usuario_id integer, p_sala_id integer);
DROP FUNCTION IF EXISTS public.sp_cancelar_agendamento(p_agendamento_id integer, p_usuario_id integer);
DROP FUNCTION IF EXISTS public.atualizar_timestamp();
-- *not* dropping schema, since initdb creates it
--
-- TOC entry 6 (class 2615 OID 2200)
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- TOC entry 210 (class 1255 OID 630612)
-- Name: atualizar_timestamp(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.atualizar_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
        BEGIN
            NEW.atualizado_em = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $$;


--
-- TOC entry 228 (class 1255 OID 631483)
-- Name: sp_cancelar_agendamento(integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sp_cancelar_agendamento(p_agendamento_id integer, p_usuario_id integer) RETURNS TABLE(success boolean, message text)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_agendamento_usuario_id INTEGER;
BEGIN
    -- Verificar se o agendamento existe e pertence ao usu├â┬írio
    SELECT usuario_id INTO v_agendamento_usuario_id
    FROM agendamentos
    WHERE id = p_agendamento_id;
    
    -- Se n├â┬úo encontrou o agendamento
    IF v_agendamento_usuario_id IS NULL THEN
        RETURN QUERY SELECT false, 'Agendamento n├â┬úo encontrado'::TEXT;
        RETURN;
    END IF;
    
    -- Se o usu├â┬írio n├â┬úo ├â┬® o dono do agendamento
    IF v_agendamento_usuario_id != p_usuario_id THEN
        RETURN QUERY SELECT false, 'Voc├â┬¬ n├â┬úo tem permiss├â┬úo para cancelar este agendamento'::TEXT;
        RETURN;
    END IF;
    
    -- Atualizar status para cancelado
    UPDATE agendamentos 
    SET status = 'cancelada', atualizado_em = NOW()
    WHERE id = p_agendamento_id;
    
    -- Criar registro no hist├â┬│rico
    INSERT INTO historico_agendamentos (
        agendamento_id, acao, usuario_id, data_acao
    ) VALUES (
        p_agendamento_id, 'cancelado', p_usuario_id, NOW()
    );
    
    -- Retornar sucesso
    RETURN QUERY SELECT true, 'Agendamento cancelado com sucesso'::TEXT;
    
EXCEPTION
    WHEN OTHERS THEN
pg_dump: dropping FK CONSTRAINT historico_agendamentos historico_agendamentos_usuario_id_fkey
pg_dump: dropping FK CONSTRAINT historico_agendamentos historico_agendamentos_agendamento_id_fkey
pg_dump: dropping FK CONSTRAINT agendamentos agendamentos_usuario_id_fkey
pg_dump: dropping FK CONSTRAINT agendamentos agendamentos_sala_id_fkey
pg_dump: dropping TRIGGER usuarios trigger_usuarios_timestamp
pg_dump: dropping TRIGGER salas trigger_salas_timestamp
pg_dump: dropping TRIGGER agendamentos trigger_agendamentos_timestamp
pg_dump: dropping INDEX idx_usuarios_email
pg_dump: dropping INDEX idx_agendamentos_usuario
pg_dump: dropping INDEX idx_agendamentos_status
pg_dump: dropping INDEX idx_agendamentos_sala_id
pg_dump: dropping INDEX idx_agendamentos_sala
pg_dump: dropping INDEX idx_agendamentos_data_inicio
pg_dump: dropping INDEX idx_agendamentos_data_fim
pg_dump: dropping CONSTRAINT usuarios usuarios_pkey
pg_dump: dropping CONSTRAINT usuarios usuarios_email_key
pg_dump: dropping CONSTRAINT salas salas_pkey
pg_dump: dropping CONSTRAINT salas salas_nome_key
pg_dump: dropping CONSTRAINT historico_agendamentos historico_agendamentos_pkey
pg_dump: dropping CONSTRAINT agendamentos agendamentos_pkey
pg_dump: dropping DEFAULT usuarios id
pg_dump: dropping DEFAULT salas id
pg_dump: dropping DEFAULT historico_agendamentos id
pg_dump: dropping DEFAULT agendamentos id
pg_dump: dropping SEQUENCE usuarios_id_seq
pg_dump: dropping TABLE usuarios
pg_dump: dropping SEQUENCE salas_id_seq
pg_dump: dropping TABLE salas
pg_dump: dropping SEQUENCE historico_agendamentos_id_seq
pg_dump: dropping TABLE historico_agendamentos
pg_dump: dropping SEQUENCE agendamentos_id_seq
pg_dump: dropping TABLE agendamentos
pg_dump: dropping FUNCTION update_timestamp()
pg_dump: dropping FUNCTION sp_obter_detalhes_agendamento(integer)
pg_dump: dropping FUNCTION sp_listar_agendamentos_por_periodo(timestamp without time zone, timestamp 
without time zone)
pg_dump: dropping FUNCTION sp_listar_agendamentos_por_data(date)
pg_dump: dropping FUNCTION sp_criar_agendamento(character varying, text, timestamp without time 
zone, timestamp without time zone, integer, character varying, integer, integer)
pg_dump: dropping FUNCTION sp_cancelar_agendamento(integer, integer)
pg_dump: dropping FUNCTION atualizar_timestamp()
pg_dump: dropping SCHEMA public
pg_dump: creating SCHEMA "public"
pg_dump: creating FUNCTION "public.atualizar_timestamp()"
pg_dump: creating FUNCTION "public.sp_cancelar_agendamento(integer, integer)"
pg_dump: creating FUNCTION "public.sp_criar_agendamento(character varying, text, timestamp without 
time zone, timestamp without time zone, integer, character varying, integer, integer)"
pg_dump: creating FUNCTION "public.sp_listar_agendamentos_por_data(date)"
pg_dump: creating FUNCTION "public.sp_listar_agendamentos_por_periodo(timestamp without time zone, 
timestamp without time zone)"
pg_dump: creating FUNCTION "public.sp_obter_detalhes_agendamento(integer)"
pg_dump: creating FUNCTION "public.update_timestamp()"
pg_dump: creating TABLE "public.agendamentos"
pg_dump: creating SEQUENCE "public.agendamentos_id_seq"
pg_dump: creating SEQUENCE OWNED BY "public.agendamentos_id_seq"
pg_dump: creating TABLE "public.historico_agendamentos"
pg_dump: creating SEQUENCE "public.historico_agendamentos_id_seq"
pg_dump: creating SEQUENCE OWNED BY "public.historico_agendamentos_id_seq"
pg_dump: creating TABLE "public.salas"
pg_dump: creating SEQUENCE "public.salas_id_seq"
pg_dump: creating SEQUENCE OWNED BY "public.salas_id_seq"
pg_dump: creating TABLE "public.usuarios"
        -- Em caso de erro, retornar mensagem de erro
        RETURN QUERY SELECT false, ('Erro ao cancelar agendamento: ' || SQLERRM)::TEXT;
END;
$$;


--
-- TOC entry 227 (class 1255 OID 631348)
-- Name: sp_criar_agendamento(character varying, text, timestamp without time zone, timestamp without time zone, integer, character varying, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sp_criar_agendamento(p_titulo character varying, p_descricao text, p_data_inicio timestamp without time zone, p_data_fim timestamp without time zone, p_participantes integer, p_link_reuniao character varying, p_usuario_id integer, p_sala_id integer) RETURNS TABLE(success boolean, message text, agendamento_id integer)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_agendamento_id INTEGER;
    v_conflito_count INTEGER;
BEGIN
    -- Verificar conflitos de hor├â┬írio
    SELECT COUNT(*) INTO v_conflito_count
    FROM agendamentos
    WHERE sala_id = p_sala_id
      AND status = 'confirmado'
      AND (
          (data_inicio <= p_data_inicio AND data_fim > p_data_inicio) OR
          (data_inicio < p_data_fim AND data_fim >= p_data_fim) OR
          (data_inicio >= p_data_inicio AND data_fim <= p_data_fim)
      );
    
    -- Se h├â┬í conflito, retornar erro
    IF v_conflito_count > 0 THEN
        RETURN QUERY SELECT false, 'Conflito de hor├â┬írio: sala j├â┬í est├â┬í ocupada neste per├â┬¡odo'::TEXT, NULL::INTEGER;
        RETURN;
    END IF;
    
    -- Inserir novo agendamento
    INSERT INTO agendamentos (
        titulo, descricao, data_inicio, data_fim, 
        participantes, link_reuniao, usuario_id, sala_id,
        status, ativo, criado_em
    ) VALUES (
        p_titulo, p_descricao, p_data_inicio, p_data_fim,
        p_participantes, p_link_reuniao, p_usuario_id, p_sala_id,
        'confirmado', true, NOW()
    ) RETURNING id INTO v_agendamento_id;
    
    -- Criar registro no hist├â┬│rico
    INSERT INTO historico_agendamentos (
        agendamento_id, acao, usuario_id, data_acao
    ) VALUES (
        v_agendamento_id, 'criado', p_usuario_id, NOW()
    );
    
    -- Retornar sucesso
    RETURN QUERY SELECT true, 'Agendamento criado com sucesso'::TEXT, v_agendamento_id;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Em caso de erro, retornar mensagem de erro
        RETURN QUERY SELECT false, ('Erro ao criar agendamento: ' || SQLERRM)::TEXT, NULL::INTEGER;
END;
$$;


--
-- TOC entry 224 (class 1255 OID 631480)
-- Name: sp_listar_agendamentos_por_data(date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sp_listar_agendamentos_por_data(p_data date) RETURNS TABLE(id integer, titulo character varying, descricao text, data_inicio timestamp without time zone, data_fim timestamp without time zone, participantes integer, link_reuniao text, status character varying, criado_em timestamp without time zone, usuario_id integer, usuario_nome character varying, sala_id integer, sala_nome character varying, sala_capacidade integer)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.titulo,
        a.descricao,
        a.data_inicio,
        a.data_fim,
        a.participantes,
        a.link_reuniao,
        a.status,
        a.criado_em,
        a.usuario_id,
        u.nome as usuario_nome,
        a.sala_id,
        s.nome as sala_nome,
        s.capacidade as sala_capacidade
    FROM agendamentos a
    INNER JOIN usuarios u ON a.usuario_id = u.id
    INNER JOIN salas s ON a.sala_id = s.id
    WHERE a.status = 'confirmado'
      AND DATE(a.data_inicio) = p_data
    ORDER BY a.data_inicio ASC;
END;
$$;


--
-- TOC entry 225 (class 1255 OID 631481)
-- Name: sp_listar_agendamentos_por_periodo(timestamp without time zone, timestamp without time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sp_listar_agendamentos_por_periodo(p_data_inicio timestamp without time zone, p_data_fim timestamp without time zone) RETURNS TABLE(id integer, titulo character varying, descricao text, data_inicio timestamp without time zone, data_fim timestamp without time zone, participantes integer, link_reuniao text, status character varying, criado_em timestamp without time zone, usuario_id integer, usuario_nome character varying, sala_id integer, sala_nome character varying, sala_capacidade integer)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.titulo,
        a.descricao,
        a.data_inicio,
        a.data_fim,
        a.participantes,
        a.link_reuniao,
        a.status,
        a.criado_em,
        a.usuario_id,
        u.nome as usuario_nome,
        a.sala_id,
        s.nome as sala_nome,
        s.capacidade as sala_capacidade
    FROM agendamentos a
    INNER JOIN usuarios u ON a.usuario_id = u.id
    INNER JOIN salas s ON a.sala_id = s.id
    WHERE a.status = 'confirmado'
      AND a.data_inicio >= p_data_inicio
      AND a.data_fim <= p_data_fim
    ORDER BY a.data_inicio ASC;
END;
$$;


--
-- TOC entry 226 (class 1255 OID 631482)
-- Name: sp_obter_detalhes_agendamento(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sp_obter_detalhes_agendamento(p_agendamento_id integer) RETURNS TABLE(id integer, titulo character varying, descricao text, data_inicio timestamp without time zone, data_fim timestamp without time zone, participantes integer, link_reuniao text, status character varying, criado_em timestamp without time zone, atualizado_em timestamp without time zone, usuario_id integer, usuario_nome character varying, usuario_email character varying, sala_id integer, sala_nome character varying, sala_capacidade integer, sala_ativa boolean)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.titulo,
        a.descricao,
        a.data_inicio,
        a.data_fim,
        a.participantes,
        a.link_reuniao,
        a.status,
        a.criado_em,
        a.atualizado_em,
        a.usuario_id,
        u.nome as usuario_nome,
        u.email as usuario_email,
        a.sala_id,
        s.nome as sala_nome,
        s.capacidade as sala_capacidade,
        s.ativa as sala_ativa
    FROM agendamentos a
    INNER JOIN usuarios u ON a.usuario_id = u.id
    INNER JOIN salas s ON a.sala_id = s.id
    WHERE a.id = p_agendamento_id;
END;
$$;


--
-- TOC entry 211 (class 1255 OID 630645)
-- Name: update_timestamp(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
            BEGIN
                NEW.atualizado_em = CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 207 (class 1259 OID 630561)
-- Name: agendamentos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agendamentos (
    id integer NOT NULL,
    sala_id integer,
    usuario_id integer,
    titulo character varying(200) NOT NULL,
    descricao text,
    data_inicio timestamp without time zone NOT NULL,
    data_fim timestamp without time zone NOT NULL,
    status character varying(20) DEFAULT 'confirmado'::character varying,
    participantes integer DEFAULT 1,
    observacoes text,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    atualizado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    link_reuniao text,
    CONSTRAINT data_valida CHECK ((data_fim > data_inicio))
);


--
-- TOC entry 206 (class 1259 OID 630559)
-- Name: agendamentos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.agendamentos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3041 (class 0 OID 0)
-- Dependencies: 206
-- Name: agendamentos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.agendamentos_id_seq OWNED BY public.agendamentos.id;


--
-- TOC entry 209 (class 1259 OID 630587)
-- Name: historico_agendamentos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.historico_agendamentos (
    id integer NOT NULL,
    agendamento_id integer,
    acao character varying(50) NOT NULL,
    usuario_id integer,
    detalhes text,
    data_acao timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 208 (class 1259 OID 630585)
-- Name: historico_agendamentos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.historico_agendamentos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3042 (class 0 OID 0)
-- Dependencies: 208
-- Name: historico_agendamentos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.historico_agendamentos_id_seq OWNED BY public.historico_agendamentos.id;


--
-- TOC entry 203 (class 1259 OID 630531)
-- Name: salas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.salas (
    id integer NOT NULL,
    nome character varying(100) NOT NULL,
    capacidade integer DEFAULT 10 NOT NULL,
    ativa boolean DEFAULT true,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    atualizado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 202 (class 1259 OID 630529)
-- Name: salas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.salas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3043 (class 0 OID 0)
-- Dependencies: 202
-- Name: salas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.salas_id_seq OWNED BY public.salas.id;


--
-- TOC entry 205 (class 1259 OID 630548)
-- Name: usuarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usuarios (
    id integer NOT NULL,
    nome character varying(100) NOT NULL,
    email character varying(150) NOT NULL,
    ativo boolean DEFAULT true,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    atualizado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    senha_hash character varying(255)
);


--
-- TOC entry 204 (class 1259 OID 630546)
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.usuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3044 (class 0 OID 0)
-- Dependencies: 204
-- Name: usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id;


--
-- TOC entry 2868 (class 2604 OID 630564)
-- Name: agendamentos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agendamentos ALTER COLUMN id SET DEFAULT nextval('public.agendamentos_id_seq'::regclass);


--
-- TOC entry 2873 (class 2604 OID 630590)
-- Name: historico_agendamentos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historico_agendamentos ALTER COLUMN id SET DEFAULT nextval('public.historico_agendamentos_id_seq'::regclass);


--
-- TOC entry 2859 (class 2604 OID 630534)
-- Name: salas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salas ALTER COLUMN id SET DEFAULT nextval('public.salas_id_seq'::regclass);


--
-- TOC entry 2864 (class 2604 OID 630551)
-- Name: usuarios id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);


--
-- TOC entry 3033 (class 0 OID 630561)
-- Dependencies: 207
pg_dump: creating SEQUENCE "public.usuarios_id_seq"
pg_dump: creating SEQUENCE OWNED BY "public.usuarios_id_seq"
pg_dump: creating DEFAULT "public.agendamentos id"
pg_dump: creating DEFAULT "public.historico_agendamentos id"
pg_dump: creating DEFAULT "public.salas id"
pg_dump: creating DEFAULT "public.usuarios id"
pg_dump: processing data for table "public.agendamentos"
pg_dump: dumping contents of table "public.agendamentos"
-- Data for Name: agendamentos; Type: TABLE DATA; Schema: public; Owner: -
--

-- Nenhum agendamento inicial


--
-- TOC entry 3035 (class 0 OID 630587)
-- Dependencies: 209
-- Data for Name: historico_agendamentos; Type: TABLE DATA; Schema: public; Owner: -
--

-- Nenhum histórico inicial


--
-- TOC entry 3029 (class 0 OID 630531)
-- Dependencies: 203
-- Data for Name: salas; Type: TABLE DATA; Schema: public; Owner: -
--

-- Inserir salas
INSERT INTO public.salas (nome, capacidade, ativa, criado_em, atualizado_em) VALUES
('Sala da Esquerda', 7, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Sala da Direita', 5, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Auditório', 30, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);


--
-- TOC entry 3031 (class 0 OID 630548)
-- Dependencies: 205
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: -
--

-- Nenhum usuário inicial (usuários serão criados via registro)


--
-- TOC entry 3045 (class 0 OID 0)
-- Dependencies: 206
-- Name: agendamentos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.agendamentos_id_seq', 1, false);


--
-- TOC entry 3046 (class 0 OID 0)
-- Dependencies: 208
-- Name: historico_agendamentos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.historico_agendamentos_id_seq', 1, false);


--
-- TOC entry 3047 (class 0 OID 0)
-- Dependencies: 202
-- Name: salas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.salas_id_seq', 2, true);


--
-- TOC entry 3048 (class 0 OID 0)
-- Dependencies: 204
-- Name: usuarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.usuarios_id_seq', 1, false);


--
-- TOC entry 2886 (class 2606 OID 630574)
-- Name: agendamentos agendamentos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agendamentos
    ADD CONSTRAINT agendamentos_pkey PRIMARY KEY (id);


--
-- TOC entry 2894 (class 2606 OID 630596)
-- Name: historico_agendamentos historico_agendamentos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historico_agendamentos
    ADD CONSTRAINT historico_agendamentos_pkey PRIMARY KEY (id);


--
-- TOC entry 2877 (class 2606 OID 630545)
-- Name: salas salas_nome_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salas
    ADD CONSTRAINT salas_nome_key UNIQUE (nome);


--
-- TOC entry 2879 (class 2606 OID 630543)
-- Name: salas salas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salas
    ADD CONSTRAINT salas_pkey PRIMARY KEY (id);


--
-- TOC entry 2882 (class 2606 OID 630558)
-- Name: usuarios usuarios_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key UNIQUE (email);


--
-- TOC entry 2884 (class 2606 OID 630556)
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- TOC entry 2887 (class 1259 OID 630608)
-- Name: idx_agendamentos_data_fim; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agendamentos_data_fim ON public.agendamentos USING btree (data_fim);


--
-- TOC entry 2888 (class 1259 OID 630607)
-- Name: idx_agendamentos_data_inicio; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agendamentos_data_inicio ON public.agendamentos USING btree (data_inicio);


--
-- TOC entry 2889 (class 1259 OID 630609)
-- Name: idx_agendamentos_sala; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agendamentos_sala ON public.agendamentos USING btree (sala_id);


--
-- TOC entry 2890 (class 1259 OID 630649)
-- Name: idx_agendamentos_sala_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agendamentos_sala_id ON public.agendamentos USING btree (sala_id);


--
-- TOC entry 2891 (class 1259 OID 630611)
-- Name: idx_agendamentos_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agendamentos_status ON public.agendamentos USING btree (status);


--
-- TOC entry 2892 (class 1259 OID 630610)
-- Name: idx_agendamentos_usuario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agendamentos_usuario ON public.agendamentos USING btree (usuario_id);


--
-- TOC entry 2880 (class 1259 OID 630650)
-- Name: idx_usuarios_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_usuarios_email ON public.usuarios USING btree (email);


--
-- TOC entry 2901 (class 2620 OID 630684)
-- Name: agendamentos trigger_agendamentos_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_agendamentos_timestamp BEFORE UPDATE ON public.agendamentos FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- TOC entry 2899 (class 2620 OID 630682)
-- Name: salas trigger_salas_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_salas_timestamp BEFORE UPDATE ON public.salas FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- TOC entry 2900 (class 2620 OID 630683)
-- Name: usuarios trigger_usuarios_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_usuarios_timestamp BEFORE UPDATE ON public.usuarios FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- TOC entry 2895 (class 2606 OID 630575)
-- Name: agendamentos agendamentos_sala_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agendamentos
    ADD CONSTRAINT agendamentos_sala_id_fkey FOREIGN KEY (sala_id) REFERENCES public.salas(id) ON DELETE CASCADE;


--
-- TOC entry 2896 (class 2606 OID 630580)
-- Name: agendamentos agendamentos_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agendamentos
    ADD CONSTRAINT agendamentos_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- TOC entry 2897 (class 2606 OID 630597)
-- Name: historico_agendamentos historico_agendamentos_agendamento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historico_agendamentos
    ADD CONSTRAINT historico_agendamentos_agendamento_id_fkey FOREIGN KEY (agendamento_id) REFERENCES public.agendamentos(id) ON DELETE CASCADE;


--
-- TOC entry 2898 (class 2606 OID 630602)
-- Name: historico_agendamentos historico_agendamentos_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historico_agendamentos
    ADD CONSTRAINT historico_agendamentos_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


-- Completed on 2025-10-30 13:13:38 UTC

--
-- PostgreSQL database dump complete
--

\unrestrict fagqI6fMgHLrc44bMOReA8Pei1yeP4wOUgdO1TL774KlwTKWIdtjSMVYFnIS6Vq

pg_dump: executing SEQUENCE SET agendamentos_id_seq
pg_dump: executing SEQUENCE SET historico_agendamentos_id_seq
pg_dump: executing SEQUENCE SET salas_id_seq
pg_dump: executing SEQUENCE SET usuarios_id_seq
pg_dump: creating CONSTRAINT "public.agendamentos agendamentos_pkey"
pg_dump: creating CONSTRAINT "public.historico_agendamentos historico_agendamentos_pkey"
pg_dump: creating CONSTRAINT "public.salas salas_nome_key"
pg_dump: creating CONSTRAINT "public.salas salas_pkey"
pg_dump: creating CONSTRAINT "public.usuarios usuarios_email_key"
pg_dump: creating CONSTRAINT "public.usuarios usuarios_pkey"
pg_dump: creating INDEX "public.idx_agendamentos_data_fim"
pg_dump: creating INDEX "public.idx_agendamentos_data_inicio"
pg_dump: creating INDEX "public.idx_agendamentos_sala"
pg_dump: creating INDEX "public.idx_agendamentos_sala_id"
pg_dump: creating INDEX "public.idx_agendamentos_status"
pg_dump: creating INDEX "public.idx_agendamentos_usuario"
pg_dump: creating INDEX "public.idx_usuarios_email"
pg_dump: creating TRIGGER "public.agendamentos trigger_agendamentos_timestamp"
pg_dump: creating TRIGGER "public.salas trigger_salas_timestamp"
pg_dump: creating TRIGGER "public.usuarios trigger_usuarios_timestamp"
pg_dump: creating FK CONSTRAINT "public.agendamentos agendamentos_sala_id_fkey"
pg_dump: creating FK CONSTRAINT "public.agendamentos agendamentos_usuario_id_fkey"
pg_dump: creating FK CONSTRAINT "public.historico_agendamentos 
historico_agendamentos_agendamento_id_fkey"
pg_dump: creating FK CONSTRAINT "public.historico_agendamentos 
historico_agendamentos_usuario_id_fkey"
