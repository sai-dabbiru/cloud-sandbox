import { NextResponse } from "next/server"

const allowedUsernames = [ "d.chaturvedi@globallogic.com",
  "ajay.3@globallogic.com",
  "anuj.chauhan2@globallogic.com",
  "kadigonda.raju@globallogic.com",
  "harsh.rithalia@globallogic.com",
  "kalash.palwanda@globallogic.com",
  "ayushi.goel@globallogic.com",
  "amit.dhanik@globallogic.com",
  "manish.kumar36@globallogic.com",
  "ritika.goel2@globallogic.com",
  "ashish.varshney@globallogic.com",
  "priya.nayak@globallogic.com",
  "utkarsh.mishra@globallogic.com",
  "sonali.mali@globallogic.com",
  "thangamani.l@globallogic.com",
  "ashish.kumar30@globallogic.com",
  "alok.s.gaur@globallogic.com",
  "mohit.kumar12@globallogic.com",
  "gaurav.aswal@globallogic.com",
  "imran.beig@globallogic.com",
  "amit.kumar42@globallogic.com",
  "aayush.nair@globallogic.com",
  "nitin.rathod@globallogic.com",
  "raj.srivastava@globallogic.com",
  "sareeta.mugde@globallogic.com",
  "karnati.keerthi@globallogic.com",
  "pawan.kumar14@globallogic.com",
  "seha.gupta@globallogic.com",
  "gautam.kumar5@globallogic.com",
  "arnab.mondal@globallogic.com",
  "sandhya.kumari@globallogic.com",
  "Pankaj.rathor@globallogic.com",
  "abhishek.singhal3@globallogic.com",
  "pranav.bansal@globallogic.com",
  "kashish.gaba@globallogic.com",
  "isha.grover@globallogic.com",
  "badam.anudeep@globallogic.com",
  "dolly.kumari@globallogic.com", "test@globallogic.com"]

export async function POST(req: Request) {
  const { username } = await req.json()
  const isAllowed = allowedUsernames.includes(username?.trim()?.toLowerCase())
  return NextResponse.json({ allowed: isAllowed })
}
