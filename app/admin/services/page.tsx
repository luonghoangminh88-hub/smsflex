import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export const dynamic = "force-dynamic"

export default async function AdminServicesPage() {
  const supabase = await createClient()

  const { data: services } = await supabase.from("services").select("*").order("name")

  const { data: countries } = await supabase.from("countries").select("*").order("name")

  const { data: servicePrices } = await supabase
    .from("service_prices")
    .select(
      `
      *,
      service:services(name),
      country:countries(name)
    `,
    )
    .order("created_at", { ascending: false })

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Quản lý dịch vụ & quốc gia</h1>
        <p className="text-muted-foreground mt-2">Cấu hình dịch vụ, quốc gia và giá cả</p>
      </div>

      <Tabs defaultValue="services" className="space-y-4">
        <TabsList>
          <TabsTrigger value="services">Dịch vụ</TabsTrigger>
          <TabsTrigger value="countries">Quốc gia</TabsTrigger>
          <TabsTrigger value="prices">Bảng giá</TabsTrigger>
        </TabsList>

        <TabsContent value="services">
          <Card>
            <CardHeader>
              <CardTitle>Danh sách dịch vụ</CardTitle>
              <CardDescription>Tổng số: {services?.length || 0} dịch vụ</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {services?.map((service: any) => (
                  <Card key={service.id} className={service.is_active ? "" : "opacity-50"}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{service.name}</p>
                          <p className="text-xs text-muted-foreground">{service.code}</p>
                        </div>
                        <Badge variant={service.is_active ? "default" : "secondary"}>
                          {service.is_active ? "Hoạt động" : "Tắt"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="countries">
          <Card>
            <CardHeader>
              <CardTitle>Danh sách quốc gia</CardTitle>
              <CardDescription>Tổng số: {countries?.length || 0} quốc gia</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {countries?.map((country: any) => (
                  <Card key={country.id} className={country.is_active ? "" : "opacity-50"}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{country.name}</p>
                          <p className="text-xs text-muted-foreground uppercase">{country.code}</p>
                        </div>
                        <Badge variant={country.is_active ? "default" : "secondary"}>
                          {country.is_active ? "Hoạt động" : "Tắt"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prices">
          <Card>
            <CardHeader>
              <CardTitle>Bảng giá dịch vụ</CardTitle>
              <CardDescription>Tổng số: {servicePrices?.length || 0} cấu hình giá</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {servicePrices?.map((price: any) => (
                  <div key={price.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div className="space-y-1">
                      <p className="font-medium">
                        {price.service?.name} - {price.country?.name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Kho: {price.stock_count}</span>
                        <Badge variant={price.is_available ? "default" : "secondary"} className="text-xs">
                          {price.is_available ? "Còn hàng" : "Hết"}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-lg">{price.price.toLocaleString("vi-VN")}đ</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
