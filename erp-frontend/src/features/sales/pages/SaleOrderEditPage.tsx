import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchSaleOrderDetail, updateSaleOrder } from '../store/saleOrder.slice';
import { UpdateSaleOrderDto } from '../dto/saleOrder.dto';
import SaleOrderForm from '../components/SaleOrderForm';
import { loadPartners } from '@/features/partner/store/partner.thunks';
import { fetchProductsThunk} from '@/features/products/store/product.thunks';

export default function SaleOrderEditPage() {
  const { id } = useParams();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { selected: order, loading } = useAppSelector(s => s.saleOrder);
  const { items: customers } = useAppSelector(s => s.partners);
  const { items: products } = useAppSelector(s => s.product);
  const { user } = useAppSelector(s => s.auth);

  useEffect(() => {
    if (id) {
      dispatch(fetchSaleOrderDetail(Number(id)));
      dispatch(loadPartners({ type: 'customer' }));
      dispatch(fetchProductsThunk());
    }
  }, [dispatch, id]);

  if (loading || !order) return <p className="p-6">Loading...</p>;

  const isOwner = order.created_by === user?.id;
  const isSales = user?.role?.code === 'SALES';
  const isDraft = order.approval_status === 'draft';
  const allowEdit = isSales && isOwner && isDraft;
  const normalizedOrder = {
    id: order.id,
    customer_id: order.customer_id,
    order_date: order.order_date,
    deletedLineIds: [],
    lines: order.lines.map(l => ({
      id: l.id,
      product_id: l.product_id,
      quantity: l.quantity,
      unit_price: l.unit_price,
      tax_rate_id: l.tax_rate_id
    }))
  };


  if (!allowEdit) {
    return (
      <p className="p-6 text-red-600">
        You do not have permission to edit this order.
      </p>
    );
  }

  const handleUpdate = async (data: UpdateSaleOrderDto) => {
    try {
      const actionResult = await dispatch(
        updateSaleOrder({ id: order.id, data })
      );
      if (updateSaleOrder.fulfilled.match(actionResult)) {
        navigate(`/sales/orders/${order.id}`);
      }
    } catch (err) {
      console.error('Failed to update order:', err);
    }
  };

  return (
    <SaleOrderForm
      mode="edit"
      defaultValue={normalizedOrder}
      onSubmit={handleUpdate}
      customers={customers}
      products={products}
      loading={loading}
    />
  );
}