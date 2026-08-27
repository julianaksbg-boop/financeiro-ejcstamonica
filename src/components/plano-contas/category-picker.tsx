import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlanoDeContas, type AccountType, type CategoriaFlat } from "@/lib/plano-contas";

interface Props {
  /** id da categoria selecionada */
  value?: string;
  /** nome legado (histórico) exibido quando não há id */
  fallbackLabel?: string;
  tipo?: AccountType | "Adiantamento" | "";
  onSelect: (cat: CategoriaFlat | null) => void;
  className?: string;
  placeholder?: string;
}

export function CategoryPicker({ value, fallbackLabel, tipo, onSelect, className, placeholder }: Props) {
  const [open, setOpen] = useState(false);
  const { flat, loading } = usePlanoDeContas();

  const options = useMemo(() => {
    const tipoFiltro = tipo === "Receita" || tipo === "Despesa" ? tipo : null;
    return flat
      .filter((c) => c.status === "ativo")
      .filter((c) => (tipoFiltro ? c.tipo === tipoFiltro : true))
      .sort((a, b) => a.caminho.localeCompare(b.caminho, "pt-BR"));
  }, [flat, tipo]);

  const grouped = useMemo(() => {
    const map = new Map<string, CategoriaFlat[]>();
    for (const c of options) {
      const key = `${c.tipo} › ${c.grupo}`;
      const arr = map.get(key) ?? [];
      arr.push(c);
      map.set(key, arr);
    }
    return [...map.entries()];
  }, [options]);

  const selected = flat.find((c) => c.id === value);
  const label = selected ? `${selected.grupo} › ${selected.nome}` : fallbackLabel || "";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between font-normal", !label && "text-muted-foreground", className)}
        >
          <span className="truncate">{label || placeholder || "Buscar categoria..."}</span>
          <ChevronsUpDown className="size-4 opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[min(24rem,90vw)]" align="start">
        <Command>
          <CommandInput placeholder="Buscar categoria..." />
          <CommandList>
            <CommandEmpty>
              {loading ? "Carregando plano de contas..." : "Nenhuma categoria encontrada."}
            </CommandEmpty>
            {value && (
              <CommandGroup>
                <CommandItem value="__limpar__" onSelect={() => { onSelect(null); setOpen(false); }}>
                  <Search className="size-3.5 mr-2 opacity-50" /> Limpar seleção
                </CommandItem>
              </CommandGroup>
            )}
            {grouped.map(([grupo, cats]) => (
              <CommandGroup key={grupo} heading={grupo}>
                {cats.map((c) => (
                  <CommandItem
                    key={c.id}
                    value={c.caminho}
                    onSelect={() => { onSelect(c); setOpen(false); }}
                  >
                    <Check className={cn("size-4 mr-2", value === c.id ? "opacity-100" : "opacity-0")} />
                    <span className="truncate">{c.nome}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
