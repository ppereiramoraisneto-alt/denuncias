import { Button } from "@/components/ui/button";
import { sair } from "@/app/admin/actions";

export function LogoutButton() {
  return (
    <form action={sair}>
      <Button type="submit" variant="secondary">
        Sair
      </Button>
    </form>
  );
}
