import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Icon, PageHeader } from '@cp/ui';
import { ICreateShopItemPayload } from '@cp/shared';

import { useCreateShopItem } from '../../../api/shop.queries';
import { usePortalBase } from '../../../hooks/usePortalBase';
import { ShopForm } from './ShopForm';

export default function ShopCreatePage() {
  const { t } = useTranslation();
  const base = usePortalBase();
  const navigate = useNavigate();
  const createItem = useCreateShopItem();

  async function submit(payload: ICreateShopItemPayload) {
    await createItem.mutateAsync(payload);
    navigate(`${base}/shop`);
  }

  return (
    <div className="flex flex-col gap-lg">
      <PageHeader
        title={t('pages.shopAdmin.createPage.title')}
        subtitle={t('pages.shopAdmin.createPage.subtitle')}
        actions={
          <Button variant="ghost" leadingIcon={<Icon name="arrow_back" size={18} />} onClick={() => navigate(`${base}/shop`)}>
            {t('pages.shopAdmin.backToShop')}
          </Button>
        }
      />
      <ShopForm
        submitLabel={t('pages.shopAdmin.createPage.submit')}
        isSubmitting={createItem.isPending}
        onSubmit={submit}
      />
    </div>
  );
}
