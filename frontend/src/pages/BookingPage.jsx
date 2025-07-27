import { useState, useEffect } from 'react';
import ConfirmationSection from '../components/ui/ConfirmationSection';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Checkbox } from '../components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { bookingsAPI } from '../lib/api'; // Ensure bookingsAPI is imported
import { couponsAPI } from '../lib/api'; // Ensure couponsAPI is imported
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const schema = yup.object().shape({
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  phone: yup.string().required('Phone number is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  tshirtSize: yup
    .string()
    .oneOf(['XS', 'S', 'M', 'L', 'XL', 'XXL'], 'Invalid T-shirt size')
    .required('T-shirt size is required'),
  gender: yup.string().required('Gender is required'),
  category: yup.string().required('Please select a category'),
  pc_associate_id: yup.string().when('category', {
    is: 'PC',
    then: (schema) => schema.required('PC Associate ID is required'),
    otherwise: (schema) => schema.optional().nullable(),
  }),
  sponsor_name: yup.string().when('category', {
    is: 'Associate',
    then: (schema) => schema.required('Sponsor name is required'),
    otherwise: (schema) => schema.optional().nullable(),
  }),
  aadhar_number: yup.string().required('Aadhar number is required'),
  has_college_coupon: yup.boolean(),
  coupon_code: yup.string().when('has_college_coupon', {
    is: true,
    then: (schema) => schema.required('College coupon code is required'),
    otherwise: (schema) => schema.optional().nullable(),
  }),
  has_referral_code: yup.boolean(),
  referral_code: yup.string().when('has_referral_code', {
    is: true,
    then: (schema) => schema.required('Referral code is required'),
    otherwise: (schema) => schema.optional().nullable(),
  }),
});

const BookingPage = () => {
  const [step, setStep] = useState(1);
  const { register, handleSubmit, watch, setValue, trigger, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      has_college_coupon: false,
      has_referral_code: false,
    },
  });

  const { user } = useAuth();
  const navigate = useNavigate();

  const category = watch('category');
  const hasCollegeCoupon = watch('has_college_coupon');

  const [appliedCouponDetails, setAppliedCouponDetails] = useState(null);
  const BASE_PRICE = 1311;

  const [bookingDetails, setBookingDetails] = useState(null);
  const [paymentResult, setPaymentResult] = useState(null); // Keep this for display on step 4, though actual payment will be via PayU

  const onSubmit = async (data) => {
    const finalAmount = appliedCouponDetails
      ? Math.max(0, BASE_PRICE - appliedCouponDetails.discount)
      : BASE_PRICE;

    setBookingDetails({
      ...data,
      user: user._id,
      ticketType: data.category,
      quantity: 1,
      totalAmount: finalAmount,
      coupon: appliedCouponDetails ? appliedCouponDetails.id : null,
    });
    setStep(3); // Proceed to confirmation step
  };

  const handleConfirmBooking = async () => {
    console.log('Confirmed booking details:', bookingDetails);
    // At this point, bookingDetails holds the final amount and coupon ID if applicable.
    // We now move to the Payment step (Step 4), which will initiate the PayU process.
    setStep(4);
  };

  // ⭐ MODIFIED: handlePaymentSuccess now initiates PayU payment
  const handlePaymentSuccess = async () => {
    try {
      // 1. Create the booking in your DB with initial 'pending' status
      const createBookingPayload = {
        ...bookingDetails,
        paymentStatus: 'pending', // Initial status for PayU payment
        paymentMethod: 'payu', // Indicate PayU will be used
        // paymentId will be set by backend upon successful PayU initiation
      };

      console.log('Frontend sending booking creation payload (for PayU initiation):', JSON.stringify(createBookingPayload, null, 2));
      const bookingResponse = await bookingsAPI.create(createBookingPayload);
      console.log('Booking successful:', bookingResponse.data);

      const createdBookingId = bookingResponse.data.data._id; // Get the ID of the newly created booking

      // 2. Initiate payment with PayU via your backend
      const paymentInitiationResponse = await bookingsAPI.initiatePayment({
        bookingId: createdBookingId, // Send the created booking ID to the backend
      });
      console.log('PayU Initiation Response:', paymentInitiationResponse.data);

      if (paymentInitiationResponse.data.success && paymentInitiationResponse.data.data) {
        const payuFormData = paymentInitiationResponse.data.data;
        
        // ⭐ Create a dynamic form and submit it to redirect to PayU
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = payuFormData.action; // PayU's payment URL

        for (const key in payuFormData) {
          if (Object.prototype.hasOwnProperty.call(payuFormData, key) && key !== 'action') {
            const hiddenField = document.createElement('input');
            hiddenField.type = 'hidden';
            hiddenField.name = key;
            hiddenField.value = payuFormData[key];
            form.appendChild(hiddenField);
          }
        }

        document.body.appendChild(form);
        form.submit(); // Submit the form to redirect to PayU
        
        toast.success('Redirecting to PayU for payment...');
        // Prevent further execution or navigation here as user is redirecting
        return; 
      } else {
        toast.error(paymentInitiationResponse.data.message || 'Failed to initiate payment.');
      }

    } catch (error) {
      console.error('Error during payment process:', error.response?.data || error);
      toast.error(error.response?.data?.message || 'Payment process failed. Please try again.');
    }
  };

  const prevStep = () => setStep(prev => prev - 1);

  const nextStep = async () => {
    console.log('Next button clicked. Current step:', step);
    let isValid = false;

    if (step === 1) {
      isValid = await trigger(['firstName', 'lastName', 'phone', 'email', 'tshirtSize', 'gender']);
      if (isValid) {
        setStep(2);
      }
    } else if (step === 2) {
      const fieldsToValidate = ['category', 'aadhar_number'];
      if (category === 'PC') fieldsToValidate.push('pc_associate_id');
      if (category === 'Associate') fieldsToValidate.push('sponsor_name');
      if (hasCollegeCoupon) fieldsToValidate.push('coupon_code');
      if (watch('has_referral_code')) fieldsToValidate.push('referral_code');

      isValid = await trigger(fieldsToValidate);

      if (isValid) {
        if (hasCollegeCoupon) {
          try {
            const couponCode = watch('coupon_code');
            const response = await couponsAPI.validateCoupon({ code: couponCode }); 
            
            if (response.data.success && response.data.data) {
              const validatedCoupon = response.data.data;
              
              setAppliedCouponDetails({
                id: validatedCoupon._id, 
                code: validatedCoupon.code,
                discount: validatedCoupon.discount,
              });
              toast.success(`Coupon "${validatedCoupon.code}" applied! You'll get a discount of ₹${validatedCoupon.discount}.`);
            } else {
              toast.error(response.data.message || 'Invalid college coupon code.');
              setAppliedCouponDetails(null);
              return;
            }
          } catch (error) {
            setAppliedCouponDetails(null);
            toast.error(error.response?.data?.message || 'Invalid college coupon code.');
            return;
          }
        } else {
            setAppliedCouponDetails(null);
        }

        if (watch('has_referral_code')) {
          if (!watch('referral_code')) {
            toast.error('Referral code is required.');
            return;
          }
        }
        handleSubmit(onSubmit)();
      }
    } else {
      setStep(prev => prev + 1);
    }
  };

  useEffect(() => {
    if (bookingDetails) {
        const currentBaseAmount = BASE_PRICE;
        const currentDiscount = appliedCouponDetails ? appliedCouponDetails.discount : 0;
        const newTotalAmount = Math.max(0, currentBaseAmount - currentDiscount);

        if (newTotalAmount !== bookingDetails.totalAmount || 
            (appliedCouponDetails ? appliedCouponDetails.id : null) !== bookingDetails.coupon) {
            
            setBookingDetails(prev => ({
                ...prev,
                totalAmount: newTotalAmount,
                coupon: appliedCouponDetails ? appliedCouponDetails.id : null,
            }));
        }
    }
  }, [appliedCouponDetails]);

  return (
    <div className="min-h-screen bg-background text-foreground py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gradient">Book Your Ticket</h1>
          <p className="text-lg text-muted-foreground">Join the ultimate fitness entrepreneur event in Bangalore</p>
        </div>

        <div className="bg-card p-8 rounded-lg shadow-lg">
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              <span className={`text-sm font-medium ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>Personal</span>
              <span className={`text-sm font-medium ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>Category</span>
              <span className={`text-sm font-medium ${step >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>Confirm</span>
              <span className={`text-sm font-medium ${step >= 4 ? 'text-primary' : 'text-muted-foreground'}`}>Payment</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2.5">
              <div className="bg-primary h-2.5 rounded-full" style={{ width: `${(step - 1) * 33.33}%` }}></div>
            </div>
          </div>

          {step === 1 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 className="text-2xl font-semibold mb-6">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" {...register('firstName')} />
                  {errors.firstName && <p className="text-destructive text-sm mt-1">{errors.firstName.message}</p>}
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" {...register('lastName')} />
                  {errors.lastName && <p className="text-destructive text-sm mt-1">{errors.lastName.message}</p>}
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" {...register('phone')} />
                  {errors.phone && <p className="text-destructive text-sm mt-1">{errors.phone.message}</p>}
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" {...register('email')} />
                  {errors.email && <p className="text-destructive text-sm mt-1">{errors.email.message}</p>}
                </div>
                <div>
                  <Label htmlFor="tshirtSize">T-shirt Size</Label>
                  <Select onValueChange={(value) => setValue('tshirtSize', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your T-shirt size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="XS">XS</SelectItem>
                      <SelectItem value="S">S</SelectItem>
                      <SelectItem value="M">M</SelectItem>
                      <SelectItem value="L">L</SelectItem>
                      <SelectItem value="XL">XL</SelectItem>
                      <SelectItem value="XXL">XXL</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.tshirtSize && <p className="text-destructive text-sm mt-1">{errors.tshirtSize.message}</p>}
                </div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select onValueChange={(value) => setValue('gender', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.gender && <p className="text-destructive text-sm mt-1">{errors.gender.message}</p>}
                </div>
              </div>
              <div className="flex justify-end mt-8">
                <Button onClick={nextStep}>Next</Button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 className="text-2xl font-semibold mb-6">Event Category</h2>
              <Select onValueChange={(value) => setValue('category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="General">General Access</SelectItem>
                  <SelectItem value="PC">PC Partner</SelectItem>
                  <SelectItem value="Associate">Associate</SelectItem>
                </SelectContent>
              </Select>
              {errors.category && <p className="text-destructive text-sm mb-6">{errors.category.message}</p>}

              {category === 'PC' && (
                <div className="mb-6">
                  <Label htmlFor="pc_associate_id">PC Associate ID</Label>
                  <Input id="pc_associate_id" {...register('pc_associate_id')} />
                  {errors.pc_associate_id && <p className="text-destructive text-sm mt-1">{errors.pc_associate_id.message}</p>}
                </div>
              )}

              {category === 'Associate' && (
                <div className="mb-6">
                  <Label htmlFor="sponsor_name">Sponsor Name</Label>
                  <Input id="sponsor_name" {...register('sponsor_name')} />
                  {errors.sponsor_name && <p className="text-destructive text-sm mt-1">{errors.sponsor_name.message}</p>}
                </div>
              )}

              <div className="mb-6">
                <Label htmlFor="aadhar_number">Aadhar Number</Label>
                <Input id="aadhar_number" {...register('aadhar_number')} />
                {errors.aadhar_number && <p className="text-destructive text-sm mt-1">{errors.aadhar_number.message}</p>}
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox id="has_college_coupon" {...register('has_college_coupon')} onCheckedChange={(checked) => {
                    setValue('has_college_coupon', checked);
                    if (!checked) {
                      setValue('coupon_code', '');
                    }
                  }} />
                  <Label htmlFor="has_college_coupon">I have a college coupon</Label>
                </div>

                {hasCollegeCoupon && (
                  <div>
                    <Label htmlFor="coupon_code">College Coupon Code</Label>
                    <Input id="coupon_code" {...register('coupon_code')} />
                    {errors.coupon_code && <p className="text-destructive text-sm mt-1">{errors.coupon_code.message}</p>}
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Checkbox id="has_referral_code" {...register('has_referral_code')} onCheckedChange={(checked) => {
                    setValue('has_referral_code', checked);
                    if (!checked) {
                      setValue('referral_code', '');
                    }
                  }} />
                  <Label htmlFor="has_referral_code">I have a referral code</Label>
                </div>

                {watch('has_referral_code') && (
                  <div>
                    <Label htmlFor="referral_code">Referral Code(s)</Label>
                    <Input id="referral_code" {...register('referral_code')} />
                    <p className="text-sm text-muted-foreground">Enter up to two codes, separated by a comma.</p>
                    {errors.referral_code && <p className="text-destructive text-sm mt-1">{errors.referral_code.message}</p>}
                  </div>
                )}
              </div>

              <div className="flex justify-between mt-8">
                <Button onClick={prevStep} variant="outline">Previous</Button>
                <Button onClick={nextStep}>Next</Button>
              </div>
            </motion.div>
          )}

          {step === 3 && bookingDetails && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <ConfirmationSection
                bookingDetails={bookingDetails}
                onConfirm={handleConfirmBooking}
                onEdit={prevStep}
              />
            </motion.div>
          )}

          {step === 4 && bookingDetails && ( // Removed paymentResult from condition as it's not used directly here anymore
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 className="text-2xl font-semibold mb-6">Proceed to Payment</h2>
              <div className="bg-card p-6 rounded-lg shadow-lg space-y-4">
                <p>You are about to be redirected to PayU to complete your payment.</p>
                <p><strong>Booking Amount:</strong> ₹{bookingDetails.totalAmount}</p>
                {appliedCouponDetails && (
                  <p className="text-sm text-muted-foreground">
                    (Coupon "{appliedCouponDetails.code}" applied: -₹{appliedCouponDetails.discount})
                  </p>
                )}
              </div>
              <div className="flex justify-end mt-8">
                <Button onClick={handlePaymentSuccess}>Pay Now via PayU</Button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingPage;