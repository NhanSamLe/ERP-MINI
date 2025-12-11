import  { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { createSaleOrder } from '@/features/sales/store/saleOrder.slice';
import SaleOrderForm from '../components/SaleOrderForm';
import { useNavigate } from 'react-router-dom';
import { CreateSaleOrderDto, UpdateSaleOrderDto } from '../dto/saleOrder.dto';
import { unwrapResult } from '@reduxjs/toolkit';
import { loadPartners } from '@/features/partner/store/partner.thunks';
import { fetchProductsThunk} from '@/features/products/store/product.thunks';

export default function SaleOrderCreatePage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { items: customers } = useAppSelector(s => s.partners);
  const { items: products } = useAppSelector(s => s.product);
  const { loading } = useAppSelector(s => s.saleOrder);

  useEffect(() => {
    dispatch(loadPartners({ type: 'customer' }));
    dispatch(fetchProductsThunk());
  }, [dispatch]);

  const handleSubmit = async (data: CreateSaleOrderDto | UpdateSaleOrderDto): Promise<void> => {
    try {
      const actionResult = await dispatch(createSaleOrder(data as CreateSaleOrderDto));
      const createdOrder = unwrapResult(actionResult);
      navigate(`/sales/orders/${createdOrder.id}`);
    } catch (err) {
      console.error('Failed to create order:', err);
    }
  };

  return (
    <SaleOrderForm
      mode="create"
      onSubmit={handleSubmit}
      customers={customers}
      products={products}
      loading={loading}
    /> 
  )
}