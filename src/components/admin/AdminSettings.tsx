import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Shield, 
  Bell, 
  Download, 
  Database,
  Key,
  Users,
  AlertTriangle,
  Save,
  CreditCard,
  Mail
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export function AdminSettings() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage your account and system preferences</p>
        </div>
        <Button>
          <Save className="mr-2 h-4 w-4" />
          Save All Changes
        </Button>
      </div>

      <Tabs defaultValue="account" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="emails">Emails</TabsTrigger>
          <TabsTrigger value="taxes">Tax & Invoices</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        {/* Account Tab */}
        <TabsContent value="account" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-lg font-medium text-primary">A</span>
                  </div>
                  <Button variant="outline" size="sm">Change Avatar</Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="full-name">Full Name</Label>
                  <Input id="full-name" defaultValue="Admin User" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" defaultValue="admin@furnistore.com" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" defaultValue="+1 555 123 4567" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input id="role" defaultValue="Super Admin" disabled />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select defaultValue="en">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="nl">Nederlands</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select defaultValue="europe/amsterdam">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="europe/amsterdam">Europe/Amsterdam</SelectItem>
                      <SelectItem value="america/new_york">America/New_York</SelectItem>
                      <SelectItem value="america/los_angeles">America/Los_Angeles</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date-format">Date Format</Label>
                  <Select defaultValue="dd/mm/yyyy">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dd/mm/yyyy">DD/MM/YYYY</SelectItem>
                      <SelectItem value="mm/dd/yyyy">MM/DD/YYYY</SelectItem>
                      <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Dark Mode</Label>
                    <p className="text-xs text-muted-foreground">Use dark theme for the admin panel</p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Stripe Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="stripe-publishable">Stripe Publishable Key</Label>
                  <Input
                    id="stripe-publishable"
                    placeholder="pk_test_..."
                    defaultValue="pk_test_51xxxxxxxxxxxxxxxxx"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stripe-secret">Stripe Secret Key</Label>
                  <Input
                    id="stripe-secret"
                    type="password"
                    placeholder="sk_test_..."
                    defaultValue="sk_test_51xxxxxxxxxxxxxxxxx"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stripe-webhook">Webhook Endpoint Secret</Label>
                  <Input
                    id="stripe-webhook"
                    type="password"
                    placeholder="whsec_..."
                    defaultValue="whsec_xxxxxxxxxxxxxxxxx"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Test Mode</Label>
                    <p className="text-xs text-muted-foreground">Use Stripe test environment</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <Button className="w-full">Test Connection</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Credit/Debit Cards</Label>
                    <p className="text-xs text-muted-foreground">Visa, Mastercard, American Express</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>PayPal</Label>
                    <p className="text-xs text-muted-foreground">PayPal and Pay Later options</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>iDEAL</Label>
                    <p className="text-xs text-muted-foreground">Dutch bank transfer</p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>SEPA Direct Debit</Label>
                    <p className="text-xs text-muted-foreground">European bank transfers</p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Apple Pay</Label>
                    <p className="text-xs text-muted-foreground">Mobile payments</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Emails Tab */}
        <TabsContent value="emails" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Provider
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-provider">Email Service</Label>
                  <Select defaultValue="resend">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="resend">Resend</SelectItem>
                      <SelectItem value="sendgrid">SendGrid</SelectItem>
                      <SelectItem value="mailgun">Mailgun</SelectItem>
                      <SelectItem value="smtp">Custom SMTP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="resend-api-key">Resend API Key</Label>
                  <Input
                    id="resend-api-key"
                    type="password"
                    placeholder="re_..."
                    defaultValue="re_xxxxxxxxxxxxxxxxx"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="from-email">From Email Address</Label>
                  <Input
                    id="from-email"
                    type="email"
                    defaultValue="noreply@furnistore.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="from-name">From Name</Label>
                  <Input
                    id="from-name"
                    defaultValue="FurniStore"
                  />
                </div>

                <Button className="w-full">Test Email Configuration</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Email Templates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Order Confirmation</p>
                      <p className="text-xs text-muted-foreground">Sent when order is placed</p>
                    </div>
                    <Button variant="outline" size="sm">Edit</Button>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Shipping Notification</p>
                      <p className="text-xs text-muted-foreground">Sent when order ships</p>
                    </div>
                    <Button variant="outline" size="sm">Edit</Button>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Welcome Email</p>
                      <p className="text-xs text-muted-foreground">Sent to new customers</p>
                    </div>
                    <Button variant="outline" size="sm">Edit</Button>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Password Reset</p>
                      <p className="text-xs text-muted-foreground">Sent for password recovery</p>
                    </div>
                    <Button variant="outline" size="sm">Edit</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tax & Invoices Tab */}
        <TabsContent value="taxes" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Tax Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="default-tax">Default Tax Rate (%)</Label>
                  <Input
                    id="default-tax"
                    type="number"
                    defaultValue="21"
                    placeholder="21"
                  />
                  <p className="text-xs text-muted-foreground">Netherlands VAT rate (BTW)</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vat-number">VAT Number</Label>
                  <Input
                    id="vat-number"
                    defaultValue="NL123456789B01"
                    placeholder="NL123456789B01"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tax-inclusive">Tax Display</Label>
                  <Select defaultValue="inclusive">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inclusive">Prices include tax</SelectItem>
                      <SelectItem value="exclusive">Prices exclude tax</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>EU VAT Compliance</Label>
                    <p className="text-xs text-muted-foreground">Automatically handle EU VAT rules</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Digital Goods Tax</Label>
                    <p className="text-xs text-muted-foreground">Apply tax based on customer location</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Invoice Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="invoice-prefix">Invoice Number Prefix</Label>
                  <Input
                    id="invoice-prefix"
                    defaultValue="INV-"
                    placeholder="INV-"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="next-invoice">Next Invoice Number</Label>
                  <Input
                    id="next-invoice"
                    type="number"
                    defaultValue="1001"
                    placeholder="1001"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invoice-terms">Payment Terms (days)</Label>
                  <Input
                    id="invoice-terms"
                    type="number"
                    defaultValue="30"
                    placeholder="30"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invoice-notes">Invoice Footer Notes</Label>
                  <Textarea
                    id="invoice-notes"
                    defaultValue="Thank you for your business! Payment is due within 30 days."
                    rows={3}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-send Invoices</Label>
                    <p className="text-xs text-muted-foreground">Email invoices automatically when orders are placed</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Password & Authentication
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input id="current-password" type="password" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input id="new-password" type="password" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input id="confirm-password" type="password" />
                </div>

                <Button variant="outline" className="w-full">
                  Update Password
                </Button>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-xs text-muted-foreground">Add extra security to your account</p>
                  </div>
                  <Switch />
                </div>

                <Button variant="outline" className="w-full">
                  <Key className="mr-2 h-4 w-4" />
                  Setup 2FA
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Security Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Login from Chrome</p>
                      <p className="text-xs text-muted-foreground">Amsterdam, Netherlands</p>
                    </div>
                    <span className="text-xs text-muted-foreground">2 hours ago</span>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Password changed</p>
                      <p className="text-xs text-muted-foreground">Security update</p>
                    </div>
                    <span className="text-xs text-muted-foreground">1 day ago</span>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Login from Safari</p>
                      <p className="text-xs text-muted-foreground">Amsterdam, Netherlands</p>
                    </div>
                    <span className="text-xs text-muted-foreground">3 days ago</span>
                  </div>
                </div>

                <Button variant="outline" className="w-full">
                  View All Activity
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium">Order Notifications</h3>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>New Orders</Label>
                    <p className="text-xs text-muted-foreground">Get notified when new orders are placed</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Order Updates</Label>
                    <p className="text-xs text-muted-foreground">Status changes and shipping updates</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Payment Notifications</Label>
                    <p className="text-xs text-muted-foreground">Failed payments and refunds</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium">Inventory Notifications</h3>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Low Stock Alerts</Label>
                    <p className="text-xs text-muted-foreground">When products are running low</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Out of Stock</Label>
                    <p className="text-xs text-muted-foreground">When products are completely out of stock</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium">System Notifications</h3>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Security Alerts</Label>
                    <p className="text-xs text-muted-foreground">Login attempts and security issues</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>System Updates</Label>
                    <p className="text-xs text-muted-foreground">Platform updates and maintenance</p>
                  </div>
                  <Switch />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Admin Users</h3>
                <Button size="sm">Add User</Button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">A</span>
                    </div>
                    <div>
                      <p className="font-medium">Admin User</p>
                      <p className="text-xs text-muted-foreground">admin@furnistore.com</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">Super Admin</span>
                    <Button variant="ghost" size="sm">Edit</Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-secondary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-secondary">M</span>
                    </div>
                    <div>
                      <p className="font-medium">Manager User</p>
                      <p className="text-xs text-muted-foreground">manager@furnistore.com</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-secondary/10 text-secondary px-2 py-1 rounded">Manager</span>
                    <Button variant="ghost" size="sm">Edit</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Data Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Database Backup</h4>
                  <p className="text-xs text-muted-foreground">Last backup: 2 hours ago</p>
                  <Button variant="outline" className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Create Backup
                  </Button>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="font-medium">Export Data</h4>
                  <div className="grid gap-2">
                    <Button variant="outline" size="sm">Export Orders</Button>
                    <Button variant="outline" size="sm">Export Products</Button>
                    <Button variant="outline" size="sm">Export Customers</Button>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="font-medium text-red-600">Danger Zone</h4>
                  <Button variant="destructive" size="sm" className="w-full">
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Clear All Data
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Version</span>
                    <span className="text-sm font-medium">2.1.0</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Database</span>
                    <span className="text-sm font-medium">PostgreSQL 15</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Uptime</span>
                    <span className="text-sm font-medium">99.9%</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Storage Used</span>
                    <span className="text-sm font-medium">2.4 GB / 10 GB</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">API Calls</span>
                    <span className="text-sm font-medium">15,432 this month</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="font-medium">System Health</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">API Status</span>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Operational</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Database</span>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Healthy</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Storage</span>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Normal</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}