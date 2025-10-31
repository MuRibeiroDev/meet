-- ==================================================
-- ESTRUTURA DO BANCO DE DADOS
-- Sistema de Agendamento de Salas de ReuniÃ£o
-- ==================================================

--
-- PostgreSQL database dump
--

\restrict yeH3KJ4zuRSQWiQJxnfd7fsp6SNPhYpnJwmEyKPqUGMickjccnGXIvavsBqgiME

-- Dumped from database version 12.20 (Ubuntu 12.20-0ubuntu0.20.04.1)
-- Dumped by pg_dump version 15.14

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET timezone = 'America/Sao_Paulo';
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
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
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
        -- Em caso de erro, retornar mensagem de erro
        RETURN QUERY SELECT false, ('Erro ao cancelar agendamento: ' || SQLERRM)::TEXT;
END;
$$;


--
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
-- Name: agendamentos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.agendamentos_id_seq OWNED BY public.agendamentos.id;


--
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
-- Name: historico_agendamentos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.historico_agendamentos_id_seq OWNED BY public.historico_agendamentos.id;


--
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
-- Name: salas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.salas_id_seq OWNED BY public.salas.id;


--
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
-- Name: usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id;


--
-- Name: agendamentos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agendamentos ALTER COLUMN id SET DEFAULT nextval('public.agendamentos_id_seq'::regclass);


--
-- Name: historico_agendamentos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historico_agendamentos ALTER COLUMN id SET DEFAULT nextval('public.historico_agendamentos_id_seq'::regclass);


--
-- Name: salas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salas ALTER COLUMN id SET DEFAULT nextval('public.salas_id_seq'::regclass);


--
-- Name: usuarios id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);


--
-- Name: agendamentos agendamentos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agendamentos
    ADD CONSTRAINT agendamentos_pkey PRIMARY KEY (id);


--
-- Name: historico_agendamentos historico_agendamentos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historico_agendamentos
    ADD CONSTRAINT historico_agendamentos_pkey PRIMARY KEY (id);


--
-- Name: salas salas_nome_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salas
    ADD CONSTRAINT salas_nome_key UNIQUE (nome);


--
-- Name: salas salas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salas
    ADD CONSTRAINT salas_pkey PRIMARY KEY (id);


--
-- Name: usuarios usuarios_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key UNIQUE (email);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- Name: idx_agendamentos_data_fim; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agendamentos_data_fim ON public.agendamentos USING btree (data_fim);


--
-- Name: idx_agendamentos_data_inicio; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agendamentos_data_inicio ON public.agendamentos USING btree (data_inicio);


--
-- Name: idx_agendamentos_sala; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agendamentos_sala ON public.agendamentos USING btree (sala_id);


--
-- Name: idx_agendamentos_sala_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agendamentos_sala_id ON public.agendamentos USING btree (sala_id);


--
-- Name: idx_agendamentos_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agendamentos_status ON public.agendamentos USING btree (status);


--
-- Name: idx_agendamentos_usuario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agendamentos_usuario ON public.agendamentos USING btree (usuario_id);


--
-- Name: idx_usuarios_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_usuarios_email ON public.usuarios USING btree (email);


--
-- Name: agendamentos trigger_agendamentos_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_agendamentos_timestamp BEFORE UPDATE ON public.agendamentos FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- Name: salas trigger_salas_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_salas_timestamp BEFORE UPDATE ON public.salas FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- Name: usuarios trigger_usuarios_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_usuarios_timestamp BEFORE UPDATE ON public.usuarios FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- Name: agendamentos agendamentos_sala_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agendamentos
    ADD CONSTRAINT agendamentos_sala_id_fkey FOREIGN KEY (sala_id) REFERENCES public.salas(id) ON DELETE CASCADE;


--
-- Name: agendamentos agendamentos_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agendamentos
    ADD CONSTRAINT agendamentos_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- Name: historico_agendamentos historico_agendamentos_agendamento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historico_agendamentos
    ADD CONSTRAINT historico_agendamentos_agendamento_id_fkey FOREIGN KEY (agendamento_id) REFERENCES public.agendamentos(id) ON DELETE CASCADE;


--
-- Name: historico_agendamentos historico_agendamentos_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historico_agendamentos
    ADD CONSTRAINT historico_agendamentos_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- PostgreSQL database dump complete
--

\unrestrict yeH3KJ4zuRSQWiQJxnfd7fsp6SNPhYpnJwmEyKPqUGMickjccnGXIvavsBqgiME



-- ==================================================
-- DADOS INICIAIS - SALAS
-- ==================================================

INSERT INTO public.salas (nome, capacidade, ativa, criado_em, atualizado_em) VALUES
('Sala da Esquerda', 7, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Sala da Direita', 5, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Auditório', 30, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
