import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Icon, PageHeader } from '@cp/ui';
import { ICreateShopItemPayload } from '@cp/shared';

import { useManageShopItems, useUpdateShopItem } from '../../../api/shop.queries';
import { usePortalBase } from '../../../hooks/usePortalBase';
import { ShopForm } from './ShopForm';

export default function ShopEditPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const base = usePortalBase();
  const navigate = useNavigate();
  const { data, isLoading, isError, error } = useManageShopItems();
  const updateItem = useUpdateShopItem(id ?? '');

  const item = data?.find((it) => it.id === id);

  async function submit(payload: ICreateShopItemPayload) {
    if (!id) return;
    await updateItem.mutateAsync(payload);
    navigate(`${base}/shop`);
  }

  if (isLoading) return <CenteredState icon="progress_activity" label={t('common.loading')} spin />;
  if (isError || !item)
    return <CenteredState icon="error" label={(error as Error)?.message ?? t('common.notFound')} />;

  return (
    <div className="flex flex-col gap-lg">
      <PageHeader
        title={t('pages.shopAdmin.editPage.title')}
        subtitle={item.name}
        actions={
          <Button variant="ghost" leadingIcon={<Icon name="arrow_back" size={18} />} onClick={() => navigate(`${base}/shop`)}>
            {t('pages.shopAdmin.backToShop')}
          </Button>
        }
      />
      <ShopForm
        key={item.id}
        defaultValues={item}
        submitLabel={t('pages.shopAdmin.editPage.submit')}
        isSubmitting={updateItem.isPending}
        onSubmit={submit}
      />
    </div>
  );
}

function CenteredState({ icon, label, spin }: { icon: string; label: string; spin?: boolean }) {
  return (
    <div className="min-h-[320px] grid place-items-center text-center text-on-surface-variant">
      <div>
        <Icon name={icon} size={36} className={spin ? 'animate-spin mx-auto mb-sm' : 'mx-auto mb-sm'} />
        <p>{label}</p>
      </div>
    </div>
  );
}
