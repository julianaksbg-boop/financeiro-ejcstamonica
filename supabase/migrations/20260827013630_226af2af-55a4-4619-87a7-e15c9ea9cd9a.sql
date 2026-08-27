CREATE TYPE public.account_type AS ENUM ('Receita', 'Despesa');
CREATE TYPE public.account_status AS ENUM ('ativo', 'arquivado');

CREATE TABLE public.account_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type public.account_type NOT NULL,
  description TEXT,
  status public.account_status NOT NULL DEFAULT 'ativo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (type, name)
);

GRANT SELECT ON public.account_groups TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.account_groups TO authenticated;
GRANT ALL ON public.account_groups TO service_role;
ALTER TABLE public.account_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios autenticados podem ver grupos" ON public.account_groups
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins podem criar grupos" ON public.account_groups
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins podem editar grupos" ON public.account_groups
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins podem excluir grupos" ON public.account_groups
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.account_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.account_groups(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  description TEXT,
  status public.account_status NOT NULL DEFAULT 'ativo',
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (group_id, name)
);

CREATE INDEX idx_account_categories_group ON public.account_categories(group_id);

GRANT SELECT ON public.account_categories TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.account_categories TO authenticated;
GRANT ALL ON public.account_categories TO service_role;
ALTER TABLE public.account_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios autenticados podem ver categorias" ON public.account_categories
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins podem criar categorias" ON public.account_categories
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins podem editar categorias" ON public.account_categories
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins podem excluir categorias" ON public.account_categories
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_account_groups_updated_at BEFORE UPDATE ON public.account_groups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_account_categories_updated_at BEFORE UPDATE ON public.account_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.account_groups (name, type) VALUES
  ('Alimentação', 'Despesa'),
  ('Materiais e Insumos', 'Despesa'),
  ('Estrutura e Organização', 'Despesa'),
  ('Eventos e Atividades', 'Despesa'),
  ('Marketing e Comunicação', 'Despesa'),
  ('Liturgia', 'Despesa'),
  ('Música', 'Despesa'),
  ('Artes e Lazer', 'Despesa'),
  ('Taxas e Serviços', 'Despesa'),
  ('Financeiro', 'Despesa'),
  ('Outros', 'Despesa'),
  ('Inscrições', 'Receita'),
  ('Doações', 'Receita'),
  ('Eventos', 'Receita'),
  ('Vendas', 'Receita'),
  ('Arrecadações', 'Receita'),
  ('Contribuições', 'Receita'),
  ('Outros', 'Receita');

INSERT INTO public.account_categories (group_id, name)
SELECT g.id, c.name
FROM (VALUES
  ('Alimentação', 'Despesa', 'Supermercado'),
  ('Alimentação', 'Despesa', 'Padaria'),
  ('Alimentação', 'Despesa', 'Açougue'),
  ('Alimentação', 'Despesa', 'Bebidas'),
  ('Alimentação', 'Despesa', 'Refeições'),
  ('Alimentação', 'Despesa', 'Lanches'),
  ('Materiais e Insumos', 'Despesa', 'Materiais de consumo'),
  ('Materiais e Insumos', 'Despesa', 'Descartáveis'),
  ('Materiais e Insumos', 'Despesa', 'Limpeza'),
  ('Estrutura e Organização', 'Despesa', 'Aluguel de espaço'),
  ('Estrutura e Organização', 'Despesa', 'Transporte'),
  ('Estrutura e Organização', 'Despesa', 'Decoração'),
  ('Eventos e Atividades', 'Despesa', 'Premiação'),
  ('Eventos e Atividades', 'Despesa', 'Confraternização'),
  ('Marketing e Comunicação', 'Despesa', 'Material gráfico'),
  ('Marketing e Comunicação', 'Despesa', 'Divulgação'),
  ('Marketing e Comunicação', 'Despesa', 'Brindes'),
  ('Marketing e Comunicação', 'Despesa', 'Camisetas'),
  ('Liturgia', 'Despesa', 'Itens liturgicos'),
  ('Música', 'Despesa', 'Som e equipamentos'),
  ('Artes e Lazer', 'Despesa', 'Materiais de arte'),
  ('Taxas e Serviços', 'Despesa', 'Taxas bancárias'),
  ('Financeiro', 'Despesa', 'Ajustes financeiros'),
  ('Outros', 'Despesa', 'Outras despesas'),
  ('Inscrições', 'Receita', 'Inscrições do Encontrão'),
  ('Inscrições', 'Receita', 'Inscrições de Eventos'),
  ('Doações', 'Receita', 'Doações recebidas'),
  ('Eventos', 'Receita', 'Quitandas'),
  ('Eventos', 'Receita', 'Santa Massa'),
  ('Eventos', 'Receita', 'Confraternização'),
  ('Vendas', 'Receita', 'Camisetas'),
  ('Vendas', 'Receita', 'Mini Bar'),
  ('Arrecadações', 'Receita', 'Rifa'),
  ('Contribuições', 'Receita', 'Contribuição mensal'),
  ('Outros', 'Receita', 'Outras receitas')
) AS c(group_name, group_type, name)
JOIN public.account_groups g ON g.name = c.group_name AND g.type = c.group_type::public.account_type;