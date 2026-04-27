import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  const event = req.body

  if (!event?.data?.attributes) {
    return res.status(400).send('Invalid payload')
  }

  // Only process successful payments
  if (event.data.attributes.status !== 'paid') {
    return res.status(200).send('ignored')
  }

  const userId = event.data.attributes.remarks

  if (!userId) {
    return res.status(400).send('No userId found')
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { error } = await supabase
    .from('profiles')
    .update({
      is_paid: true,
      job_offer_credits: 10
    })
    .eq('id', userId)

  if (error) {
    console.error(error)
    return res.status(500).send('DB error')
  }

  return res.status(200).send('success')
}